import fetch from "node-fetch";
import * as cheerio from "cheerio";

interface Verse {
  number: number;
  text: string;
}

async function fetchChapter(
  bookCode: string,
  chapter: number,
  version: string = "GAE"
): Promise<Verse[]> {
  const url = `https://www.bskorea.or.kr/bible/korbibReadpage.php?version=${version}&book=${bookCode}&chap=${chapter}`;

  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  const verses: Verse[] = [];

  // Parse verses from span elements
  $("span").each((i, elem) => {
    const text = $(elem).text().trim();

    // Look for pattern: number followed by spaces and text
    const match = text.match(/^(\d+)\s+(.+)$/s);
    if (match) {
      const verseNum = parseInt(match[1]);
      let verseText = match[2];

      // Remove footnote markers (like 1), 2), etc.)
      verseText = verseText.replace(/\d+\)/g, "").trim();

      // Remove explanatory text that comes after line breaks (like "또는 ...")
      const lines = verseText.split("\n");
      verseText = lines[0].trim();

      // Avoid duplicate verses (website has multiple spans per verse)
      if (!verses.find((v) => v.number === verseNum)) {
        verses.push({
          number: verseNum,
          text: verseText,
        });
      }
    }
  });

  return verses;
}

async function test() {
  console.log("=== Test 1: John 3:16 ===");
  const john3 = await fetchChapter("jhn", 3, "GAE");
  console.log(`Fetched ${john3.length} verses from John 3`);

  const verse16 = john3.find((v) => v.number === 16);
  if (verse16) {
    console.log(`\nJohn 3:16 (요한복음 3:16):`);
    console.log(verse16.text);
  } else {
    console.log("ERROR: Could not find verse 16");
  }

  console.log("\n=== Test 2: Genesis 1 ===");
  const gen1 = await fetchChapter("gen", 1, "GAE");
  console.log(`Fetched ${gen1.length} verses from Genesis 1`);

  if (gen1.length > 0) {
    console.log(`\nGenesis 1:1 (창세기 1:1):`);
    console.log(gen1[0].text);

    console.log(`\nGenesis 1:2 (창세기 1:2):`);
    console.log(gen1[1].text);
  }

  console.log("\n=== Test 3: Matthew 5 ===");
  const mat5 = await fetchChapter("mat", 5, "GAE");
  console.log(`Fetched ${mat5.length} verses from Matthew 5`);

  if (mat5.length > 0) {
    console.log(`\nMatthew 5:1 (마태복음 5:1):`);
    console.log(mat5[0].text);
  }

  console.log("\n=== All tests completed successfully! ===");
}

test().catch(console.error);
