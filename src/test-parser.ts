import fetch from "node-fetch";
import * as cheerio from "cheerio";

async function testParse() {
  const url = "https://www.bskorea.or.kr/bible/korbibReadpage.php?version=GAE&book=jhn&chap=3";

  console.log("Fetching:", url);
  const response = await fetch(url);
  const html = await response.text();

  console.log("\n=== HTML Length:", html.length);

  const $ = cheerio.load(html);

  // Try to find verse patterns
  console.log("\n=== Looking for verse elements ===");

  // Method 1: Look for specific classes
  const verseBox = $(".verseBox").length;
  console.log("Elements with class 'verseBox':", verseBox);

  const verse = $(".verse").length;
  console.log("Elements with class 'verse':", verse);

  // Method 2: Look for common Korean Bible patterns
  const bodyText = $("body").text();
  console.log("\n=== Body text sample (first 500 chars) ===");
  console.log(bodyText.substring(0, 500));

  // Method 3: Look for paragraph or div elements
  console.log("\n=== Looking for p tags ===");
  $("p").each((i, elem) => {
    if (i < 5) {
      const text = $(elem).text().trim();
      if (text) {
        console.log(`P[${i}]:`, text.substring(0, 100));
      }
    }
  });

  console.log("\n=== Looking for div tags with text ===");
  $("div").each((i, elem) => {
    if (i < 10) {
      const text = $(elem).text().trim();
      if (text && text.length > 10 && text.length < 200) {
        console.log(`DIV[${i}]:`, text.substring(0, 100));
      }
    }
  });

  // Method 4: Look for span elements
  console.log("\n=== Looking for span tags ===");
  $("span").each((i, elem) => {
    if (i < 10) {
      const text = $(elem).text().trim();
      const className = $(elem).attr("class");
      if (text && text.length > 5) {
        console.log(`SPAN[${i}] (${className}):`, text.substring(0, 80));
      }
    }
  });

  // Method 5: Look for table structures
  console.log("\n=== Looking for tables ===");
  console.log("Number of tables:", $("table").length);

  // Method 6: Try to find verse numbers
  console.log("\n=== Looking for numbered patterns ===");
  const bodyHtml = $("body").html() || "";
  const versePatterns = bodyHtml.match(/\d+\s*[가-힣]+/g);
  if (versePatterns) {
    console.log("Found patterns:", versePatterns.slice(0, 5));
  }
}

testParse().catch(console.error);
