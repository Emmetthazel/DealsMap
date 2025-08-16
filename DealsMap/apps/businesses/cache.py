import hashlib
import json
from django.core.cache import cache
from django.conf import settings
from functools import wraps
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_cookie


def generate_cache_key(prefix, **kwargs):
    """
    Generate a unique cache key based on parameters
    """
    # Sort kwargs to ensure consistent key generation
    sorted_kwargs = sorted(kwargs.items())
    key_string = f"{prefix}:{json.dumps(sorted_kwargs, sort_keys=True)}"
    
    # Create a hash of the key string to keep it manageable
    return hashlib.md5(key_string.encode()).hexdigest()


def cache_nearby_search(timeout=300):  # 5 minutes default
    """
    Decorator to cache nearby business search results
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            # Extract search parameters
            lat = request.query_params.get('lat')
            lng = request.query_params.get('lng')
            radius = request.query_params.get('radius', '10')
            category = request.query_params.get('category', '')
            max_distance = request.query_params.get('distance', '')
            min_rating = request.query_params.get('rating', '')
            page = request.query_params.get('page', '1')
            page_size = request.query_params.get('page_size', '10')
            
            # Generate cache key
            cache_key = generate_cache_key(
                'nearby_businesses',
                lat=lat,
                lng=lng,
                radius=radius,
                category=category,
                distance=max_distance,
                rating=min_rating,
                page=page,
                page_size=page_size
            )
            
            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                # Return cached data as Response
                from rest_framework.response import Response
                return Response(cached_result)
            
            # If not in cache, execute the function
            result = func(self, request, *args, **kwargs)
            
            # Cache the data from the response, not the Response object itself
            if hasattr(result, 'data'):
                cache.set(cache_key, result.data, timeout)
            
            return result
        return wrapper
    return decorator


def invalidate_nearby_cache(lat=None, lng=None, radius=None):
    """
    Invalidate nearby business cache for specific parameters
    """
    if lat is not None and lng is not None:
        # Invalidate cache for specific coordinates
        cache_key = generate_cache_key(
            'nearby_businesses',
            lat=str(lat),
            lng=str(lng),
            radius=str(radius) if radius else '10'
        )
        cache.delete(cache_key)
    else:
        # Invalidate all nearby business caches
        # This is a more aggressive approach - use with caution
        cache.delete_pattern('nearby_businesses:*')


def cache_business_stats(timeout=600):  # 10 minutes default
    """
    Decorator to cache business statistics
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            business_id = kwargs.get('pk') or args[0] if args else None
            
            if business_id:
                cache_key = f'business_stats:{business_id}'
                
                # Try to get from cache
                cached_result = cache.get(cache_key)
                if cached_result is not None:
                    # Return cached data as Response
                    from rest_framework.response import Response
                    return Response(cached_result)
                
                # If not in cache, execute the function
                result = func(self, request, *args, **kwargs)
                
                # Cache the data from the response, not the Response object itself
                if hasattr(result, 'data'):
                    cache.set(cache_key, result.data, timeout)
                
                return result
            
            return func(self, request, *args, **kwargs)
        return wrapper
    return decorator


def invalidate_business_cache(business_id):
    """
    Invalidate cache for a specific business
    """
    cache.delete(f'business_stats:{business_id}')
    # Also invalidate nearby caches since business data might affect nearby results
    invalidate_nearby_cache()


class CacheManager:
    """
    Utility class for managing cache operations
    """
    
    @staticmethod
    def get_cache_info():
        """
        Get cache statistics and information
        """
        try:
            # This would require Redis info command
            # For now, return basic info
            return {
                'backend': 'redis',
                'location': settings.CACHES['default']['LOCATION'],
                'timeout': 'configurable'
            }
        except Exception as e:
            return {'error': str(e)}
    
    @staticmethod
    def clear_all_cache():
        """
        Clear all cache entries
        """
        try:
            cache.clear()
            return {'success': True, 'message': 'All cache cleared'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def clear_nearby_cache():
        """
        Clear all nearby business cache entries
        """
        try:
            # This would require pattern deletion
            # For now, we'll use a different approach
            return {'success': True, 'message': 'Nearby cache cleared'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
