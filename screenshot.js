const puppeteer = require('puppeteer');
const path = require('path');
(async ()=>{
  try{
    const browser = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']});
    const page = await browser.newPage();
    const url = 'file://' + path.resolve('./index.html');
    console.log('opening', url);
    await page.goto(url, {waitUntil:'networkidle0', timeout: 30000});
  await page.waitForSelector('#calcBtn', {timeout:10000});
  await page.evaluate(()=>{ const b = document.querySelector('#calcBtn'); if(b) b.click(); });
  await page.waitForTimeout(800);
  const resultsHTML = await page.evaluate(()=> document.getElementById('results') ? document.getElementById('results').innerHTML : 'no results');
  console.log('RESULTS_HTML_START');
  console.log(resultsHTML);
  console.log('RESULTS_HTML_END');
    await page.screenshot({path:'smoke.png', fullPage:true});
    await browser.close();
    console.log('screenshot saved');
  }catch(err){
    console.error('screenshot failed:', err && err.stack ? err.stack : err);
    process.exitCode = 2;
  }
})();
