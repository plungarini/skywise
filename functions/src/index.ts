import * as functions from 'firebase-functions';
import * as puppeteer from 'puppeteer';

const FFN = functions.region('europe-west2');

export const getSitemapLinks = FFN.runWith({memory: '1GB', timeoutSeconds: 540}).https.onCall(async (data) => {
  const browser = await puppeteer.launch({
    headless: true,
    timeout: 20000,
    ignoreHTTPSErrors: true,
    slowMo: 0,
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-first-run',
      '--no-sandbox',
      '--no-zygote',
      '--window-size=1280,720',
    ],
  });

  return scraperPage(browser, data);
});

const scraperPage = async (browser: puppeteer.Browser, pageLink: string) => {
  let links: { href?: string; name?: string }[] = [];
  let nextPage = '';
  try {
    const page = await browser.newPage();

    await page.setViewport({width: 1280, height: 720});

    // Block images, videos, fonts from downloading
    await page.setRequestInterception(true);

    page.on('request', (interceptedRequest) => {
      const blockResources = ['script', 'stylesheet', 'image', 'media', 'font'];
      if (blockResources.includes(interceptedRequest.resourceType())) {
        interceptedRequest.abort();
      } else {
        interceptedRequest.continue();
      }
    });

    // Change the user agent of the scraper
    await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
    );

    await page.goto(pageLink, {
      waitUntil: 'domcontentloaded',
    });

    const listSelector = '.mw-allpages-body ul li';

    links = await page.$$eval(listSelector, (li) => {
      const pageLinks: { href?: string; name?: string }[] = [];
      li.forEach((link) => {
        const href = link.querySelector('a')?.href;
        const name = (link as any).innerText;
        pageLinks.push({href, name});
      });
      return pageLinks;
    });
    nextPage = await page.$eval('link[rel="next"]', (next) => (next as any)?.href);
  } catch (error) {
    console.log(error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  return {links, nextPage};
};
