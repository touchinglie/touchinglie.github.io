importScripts('https://cdn.jsdelivr.net/npm/workbox-sw@7.4.1/build/workbox-sw.min.js');

// 缓存版本号
let cacheVersion = '0.0.2';
// 最大条目数
const maxEntries = 100;

if (workbox) {
    console.log(`Yay! Workbox is loaded 🎉`);
    // rss 、sitemap 不缓存
    workbox.routing.registerRoute(
        new RegExp('^https://gitblog\.dowblog\.top/(index|sitemap)\.xml'),
        new workbox.strategies.NetworkOnly()
    );
    // 缓存 HTML
    workbox.routing.registerRoute(
        new RegExp('.*\.html'),
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'html-cache' + cacheVersion,
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: maxEntries,
                    maxAgeSeconds: 30 * 24 * 60 * 60,
                }),
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
            ],
        })
    );
    // 缓存 Google Fonts
    workbox.routing.registerRoute(
        new RegExp('.*\.(?:woff|woff2|ttf|otf|eot)'),
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'google-fonts' + cacheVersion,
            plugins: [
                // 使用 expiration 插件实现缓存条目数目和时间控制
                new workbox.expiration.ExpirationPlugin({
                    // 最大缓存条目数
                    maxEntries: maxEntries,
                    // 最长缓存时间 30 天
                    maxAgeSeconds: 30 * 24 * 60 * 60,
                }),
                // 使用 cacheableResponse 插件缓存状态码为 0 的请求
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
            ],
        })
    );
    // 缓存 bootcdn、unpkg、jsdelivr 等公共库，用正则匹配
    workbox.routing.registerRoute(
        new RegExp('^https://(?:cdn\.bootcdn\.net|unpkg\.com|*\.jsdelivr\.net)'),
        new workbox.strategies.CacheFirst({
            cacheName: 'cdn' + cacheVersion,
            fetchOptions: {
                mode: 'cors',
                credentials: 'omit',
            },
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: maxEntries,
                    maxAgeSeconds: 30 * 24 * 60 * 60,
                }),
            ],
        })
    );

    // 后缀匹配，针对其余没有被域名匹配到的静态文件
    workbox.routing.registerRoute(
        new RegExp('.*\.(?:png|jpg|jpeg|svg|gif|webp|ico)'),
        new workbox.strategies.StaleWhileRevalidate()
    );
    workbox.routing.registerRoute(
        new RegExp('.*\.(css|js)'),
        new workbox.strategies.StaleWhileRevalidate(
            {
                fetchOptions: {
                    mode: 'cors',
                },
            }
        )
    );

    // 默认匹配剩下的请求
    workbox.routing.setDefaultHandler(
        // 优先使用缓存，缓存没有则使用网络请求
        new workbox.strategies.NetworkFirst({
            networkTimeoutSeconds: 3,
        })
    );

} else {
    console.log(`Boo! Workbox didn't load 😬`);
}