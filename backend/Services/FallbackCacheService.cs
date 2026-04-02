using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;

namespace INVOICEMANAGEMENT.Services;

public class FallbackCacheService : ICacheService
{
    private readonly IMemoryCache _memoryCache;
    private readonly IDistributedCache? _distributedCache;
    private readonly bool _useRedis;

    public FallbackCacheService(IMemoryCache memoryCache, IDistributedCache distributedCache)
    {
        _memoryCache = memoryCache;
        _distributedCache = distributedCache;
        // Optimistically try Redis; per-call catch will fallback if unavailable
        _useRedis = distributedCache != null;
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        try
        {
            if (_useRedis && _distributedCache != null)
            {
                var cachedData = await _distributedCache.GetStringAsync(key);
                if (!string.IsNullOrEmpty(cachedData))
                    return JsonSerializer.Deserialize<T>(cachedData);
            }
        }
        catch
        {
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
            if (_useRedis && _distributedCache != null)
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
            if (_useRedis && _distributedCache != null)
            {
                await _distributedCache.RemoveAsync(key);
            }
        }
        catch
        {
            // Fallback to memory cache if Redis fails
        }

        // Memory cache fallback
        _memoryCache.Remove(key);
        await Task.CompletedTask;
    }

    public async Task RemoveByPrefixAsync(string prefix)
    {
        // For memory cache, we need to track keys or use a different approach
        // This is a simplified implementation
        await Task.CompletedTask;
    }
}
