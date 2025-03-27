// Ім'я кешу, який використовуватиметься для збереження ресурсів
const CACHE_NAME = "pwa-cache-v1";

// Масив ресурсів, які будуть кешовані при встановленні Service Worker 
// ви кешуєте всі свої файли
const ASSETS = [
  "/pvi/",           
  "/pvi/index.html",           
  "/pvi/nav.css",           
  "/pvi/pviJs.js",
  "/pvi/pviStyle.css",
  "/pvi/tasksTab.html",
  "/pvi/dashboard.html",
  "/pvi/icons/icons.512.png",
  "/pvi/icons/icons.256.png",            
  "/pvi/icons/icons.192.png",            
  "/pvi/icons/icons.128.png",            

];

// Подія встановлення Service Worker
// Відбувається при першому запуску або коли SW оновлюється
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching resources...");
      ASSETS.forEach((asset) => {
        cache.add(asset).catch((err) => console.error(`Failed to cache ${asset}:`, err));
      });
    })
  );
});

// Подія обробки запитів від клієнта (браузера)
// Якщо файл є в кеші – повертаємо його, інакше робимо запит до мережі
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        // Запит до мережі, якщо ресурсу немає в кеші
        const networkFetch = fetch(event.request).then((networkResponse) => {
          // Зберігаємо отриманий файл у кеш для майбутніх запитів
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });

        // Повертаємо кешовану версію, якщо вона є, інакше робимо запит до мережі
        return cachedResponse || networkFetch;
      });
    })
  );
});

// Подія активації Service Worker
// Видаляє старі кеші, які більше не використовуються
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME) // Знаходимо старі кеші
          .map((key) => caches.delete(key))   // Видаляємо їх
      );
    }).then(() => {
      console.log("Новий Service Worker активовано.");
      return self.clients.claim(); // Переключаємо новий SW для всіх вкладок
    })
  );
});