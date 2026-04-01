using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace INVOICEMANAGEMENT.Services;

public interface ICacheService
{
    Task<T?> GetAsync<T>(string key);
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null);
    Task RemoveAsync(string key);
    Task RemoveByPrefixAsync(string prefix);
}

public class RedisCacheService : ICacheService
{
    private readonly IDistributedCache _cache;
    private readonly DistributedCacheEntryOptions _defaultOptions;

    public RedisCacheService(IDistributedCache cache)
    {
        _cache = cache;
        _defaultOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1)
        };
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        var cachedData = await _cache.GetStringAsync(key);
        if (string.IsNullOrEmpty(cachedData))
            return default(T);

        return JsonSerializer.Deserialize<T>(cachedData);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null)
    {
        var options = expiration.HasValue 
            ? new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = expiration }
            : _defaultOptions;

        var serializedData = JsonSerializer.Serialize(value);
        await _cache.SetStringAsync(key, serializedData, options);
    }

    public async Task RemoveAsync(string key)
    {
        await _cache.RemoveAsync(key);
    }

    public async Task RemoveByPrefixAsync(string prefix)
    {
        // Note: StackExchangeRedis doesn't support pattern-based removal directly
        // This would require Redis-specific implementation or maintaining a key registry
        // For now, we'll implement a basic approach
        var keys = new List<string>();
        // This is a simplified approach - in production, you might want to use Redis SCAN command
        await Task.CompletedTask; // Placeholder for Redis-specific implementation
    }
}
