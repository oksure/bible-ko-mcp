import fetch from "node-fetch";
import * as cheerio from "cheerio";

async function testParse() {
  const url = "https://www.bskorea.or.kr/bible/korbibReadpage.php?version=GAE&book=jhn&chap=3";

  console.log("Fetching:", url);
  const response = await fetch(url);
  const html = await response.text();

  const $ = cheerio.load(html);

  console.log("\n=== All span elements (first 20) ===");
  $("span").each((i, elem) => {
    if (i < 20) {
      const text = $(elem).text().trim();
      const className = $(elem).attr("class") || "no-class";
      const id = $(elem).attr("id") || "no-id";
      console.log(`\nSPAN[${i}]`);
      console.log(`  Class: ${className}`);
      console.log(`  ID: ${id}`);
      console.log(`  Text: ${text.substring(0, 150)}`);
    }
  });

  // Try to parse verses
  console.log("\n\n=== Attempting to parse verses ===");
  const verses: Array<{ number: number; text: string }> = [];

  $("span").each((i, elem) => {
    const text = $(elem).text().trim();

    // Look for pattern: number followed by text
    const match = text.match(/^(\d+)\s+(.+)$/s);
    if (match) {
      const verseNum = parseInt(match[1]);
      let verseText = match[2];

      // Remove footnote markers like 1), 2), etc.
      verseText = verseText.replace(/\d+\)/g, "").trim();

      verses.push({
        number: verseNum,
        text: verseText,
      });
    }
  });

  console.log(`\nParsed ${verses.length} verses:`);
  verses.slice(0, 5).forEach((v) => {
    console.log(`\nVerse ${v.number}:`);
    console.log(`  ${v.text.substring(0, 100)}...`);
  });
}

testParse().catch(console.error);
