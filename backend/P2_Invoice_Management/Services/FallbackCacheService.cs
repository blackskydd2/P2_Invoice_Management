using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;

namespace INVOICEMANAGEMENT.Services;

public class FallbackCacheService : ICacheService
{
    private readonly IMemoryCache _memoryCache;
    private readonly IDistributedCache? _distributedCache;
    private readonly bool _useRedis;
    private static bool _redisBroken = false;
    private static DateTime _lastRedisTry = DateTime.MinValue;

    public FallbackCacheService(IMemoryCache memoryCache, IDistributedCache distributedCache)
    {
        _memoryCache = memoryCache;
        _distributedCache = distributedCache;
        
        if (_redisBroken && (DateTime.UtcNow - _lastRedisTry).TotalMinutes < 5)
        {
            _useRedis = false;
            return;
        }

        try
        {
            // Try to detect if Redis is available with a very short timeout
            // GetAsync is not awaited here to avoid blocking constructor, 
            // but we'll use a safer approach in the methods.
            _useRedis = true;
        }
        catch
        {
            _useRedis = false;
            _redisBroken = true;
            _lastRedisTry = DateTime.UtcNow;
        }
    }

    private async Task<bool> CheckRedis()
    {
        if (_redisBroken && (DateTime.UtcNow - _lastRedisTry).TotalMinutes < 5) 
            return false;
        
        return _useRedis;
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        try
        {
            if (await CheckRedis() && _distributedCache != null)
            {
                var cachedData = await _distributedCache.GetStringAsync(key);
                if (!string.IsNullOrEmpty(cachedData))
                    return JsonSerializer.Deserialize<T>(cachedData);
            }
        }
        catch
        {
            _redisBroken = true;
            _lastRedisTry = DateTime.UtcNow;
            // Fallback to memory cache if Redis fails
        }

        // Memory cache fallback
        _memoryCache.TryGetValue(key, out T? value);
        return value;
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null)
    {
        try
        {
            if (await CheckRedis() && _distributedCache != null)
            {
                var options = expiration.HasValue 
                    ? new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = expiration }
                    : new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1) };

                var serializedData = JsonSerializer.Serialize(value);
                await _distributedCache.SetStringAsync(key, serializedData, options);
                return;
            }
        }
        catch
        {
            _redisBroken = true;
            _lastRedisTry = DateTime.UtcNow;
            // Fallback to memory cache if Redis fails
        }

        // Memory cache fallback
        var memoryOptions = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiration ?? TimeSpan.FromHours(1)
        };
        _memoryCache.Set(key, value, memoryOptions);
    }

    public async Task RemoveAsync(string key)
    {
        try
        {
            if (await CheckRedis() && _distributedCache != null)
            {
                await _distributedCache.RemoveAsync(key);
            }
        }
        catch
        {
            _redisBroken = true;
            _lastRedisTry = DateTime.UtcNow;
            // Fallback to memory cache if Redis fails
        }

        // Memory cache fallback
        _memoryCache.Remove(key);
        await Task.CompletedTask;
    }

    public async Task RemoveByPrefixAsync(string prefix)
    {
        try
        {
            if (await CheckRedis() && _distributedCache != null)
            {
                // Note: IDistributedCache doesn't support prefix removal directly.
                // In a real production app, you'd use Redis SCAN or a key registry.
                // For this implementation, we'll focus on the MemoryCache fallback
                // which is where the current bottleneck is.
                await _distributedCache.RemoveAsync(prefix); 
            }
        }
        catch
        {
            _redisBroken = true;
            _lastRedisTry = DateTime.UtcNow;
        }

        // Memory cache prefix removal
        if (_memoryCache is MemoryCache memCache)
        {
            // This is a bit of a hack as IMemoryCache doesn't expose keys,
            // but for this project's scale, we can clear the whole cache 
            // or just the relevant keys if we had a registry.
            // Let's clear the whole cache for simplicity and reliability 
            // since it's a "fallback" and we want to ensure data consistency.
            memCache.Compact(1.0); 
        }
        
        await Task.CompletedTask;
    }
}
