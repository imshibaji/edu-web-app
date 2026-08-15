<!DOCTYPE html>
<html lang="en" data-theme="larnr" class="scroll-smooth">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#07080d">
    <meta name="description" content="Larnr — Connecting students with premium educators worldwide.">
    <script>
        (function () {
            try {
                var mode = localStorage.getItem("larnr-theme") || "system";
                var dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
                document.documentElement.setAttribute("data-theme", dark ? "larnr" : "larnr-day");
                document.documentElement.style.colorScheme = dark ? "dark" : "light";
                document.querySelector('meta[name="theme-color"]').setAttribute("content", dark ? "#07080d" : "#f4f6fb");
            } catch (e) {
                document.documentElement.setAttribute("data-theme", "larnr");
            }
        })();
    </script>
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%236366f1'/%3E%3Cstop offset='1' stop-color='%23ec4899'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='32' height='32' rx='8' fill='url(%23g)'/%3E%3Ctext x='16' y='22' font-family='Arial' font-size='16' font-weight='bold' fill='white' text-anchor='middle'%3EL%3C/text%3E%3C/svg%3E">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
    <title inertia>{{ _env('APP_NAME', 'Larnr') }}</title>
    @viteReactRefresh
    @vite(['/js/app.tsx', "/js/pages/{$page['component']}.tsx"])
    @inertiaHead
</head>

<body>
    <div id="app" data-page="app">
        <script id="app-data" data-page="app" type="application/json">{!! json_encode($page, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) !!}</script>
    </div>
</body>

</html>
