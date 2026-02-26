from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    page.goto("http://localhost:3000/dashboard")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(3000)

    # Find the scrollable container (the main content area with overflow-y-auto)
    # Try scrolling the main element or the first child with overflow
    scroll_js = """
    const containers = document.querySelectorAll('[class*="overflow-y"]');
    let scrolled = false;
    for (const c of containers) {
        if (c.scrollHeight > c.clientHeight) {
            c.scrollTop = 3000;
            scrolled = true;
            break;
        }
    }
    if (!scrolled) {
        // Try the main tag or the content wrapper
        const main = document.querySelector('main') || document.querySelector('[class*="flex-1"]');
        if (main && main.scrollHeight > main.clientHeight) {
            main.scrollTop = 3000;
        }
    }
    """
    page.evaluate(scroll_js)
    page.wait_for_timeout(2000)
    page.screenshot(path="screenshot-feed-mid.png")
    print("Mid-scroll screenshot saved")

    # Scroll more
    page.evaluate("""
    const containers = document.querySelectorAll('[class*="overflow-y"]');
    for (const c of containers) {
        if (c.scrollHeight > c.clientHeight) {
            c.scrollTop = 8000;
            break;
        }
    }
    """)
    page.wait_for_timeout(2000)
    page.screenshot(path="screenshot-feed-far.png")
    print("Far-scroll screenshot saved")

    browser.close()
