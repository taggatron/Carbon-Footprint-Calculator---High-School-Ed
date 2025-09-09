const puppeteer = require('puppeteer');
const path = require('path');
(async ()=>{
  try{
    const browser = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']});
    const page = await browser.newPage();
    // forward all page console messages to node stdout for debugging
    page.on('console', msg => {
      try{ console.log('PAGE_LOG>', msg.text()); }catch(e){}
    });
    page.on('pageerror', err => console.error('PAGE_ERROR>', err && err.stack ? err.stack : err));
    page.on('requestfailed', req => console.log('REQ_FAIL>', req.url(), req.failure() && req.failure().errorText));

    const url = 'file://' + path.resolve('./index.html');
    console.log('opening', url);
    await page.setViewport({width:1200,height:900});
    await page.goto(url, {waitUntil:'networkidle2', timeout: 45000});

    // dump initial body length
    const bodyLen = await page.evaluate(()=> document.body ? document.body.innerHTML.length : 0);
    console.log('initial body length:', bodyLen);

    await page.waitForSelector('#calcBtn', {timeout:15000});
    // trigger click via evaluate to avoid clickability issues
    await page.evaluate(()=>{ const b = document.querySelector('#calcBtn'); if(b) b.click(); });

    // wait for results to appear
    await page.waitForFunction(()=>{
      const el = document.getElementById('results');
      return el && el.innerText && el.innerText.length > 10;
    }, {timeout: 10000}).catch(()=>{});

  // Give a bit more time for UI updates
  // Use a small Promise-based delay to remain compatible with older/newer Puppeteer versions
  await new Promise(resolve => setTimeout(resolve, 500));

    const resultsHTML = await page.evaluate(()=> document.getElementById('results') ? document.getElementById('results').innerHTML : 'no results');
    console.log('RESULTS_HTML_START');
    console.log(resultsHTML.substring(0, 2000));
    console.log('...RESULTS_TRUNCATED...');
    console.log('RESULTS_HTML_END');

    // save a copy of page HTML for inspection
    const fullHTML = await page.content();
    const fs = require('fs');
    try{ fs.writeFileSync('page_dump.html', fullHTML); console.log('wrote page_dump.html'); }catch(e){ console.error('failed write page_dump', e); }

    // attempt screenshot
    await page.screenshot({path:'smoke.png', fullPage:true});
    console.log('screenshot saved as smoke.png');
    await browser.close();
  }catch(err){
    console.error('screenshot failed:', err && err.stack ? err.stack : err);
    process.exitCode = 2;
  }
})();
