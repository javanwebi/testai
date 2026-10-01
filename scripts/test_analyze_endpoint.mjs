import fs from 'fs';

async function main() {
  const userImg = fs.readFileSync('src/assets/imagesproducts/e(632).png').toString('base64');
  console.log('Posting /api/ai/analyze-part...');
  const t0 = Date.now();
  const res = await fetch('http://localhost:3000/api/ai/analyze-part', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64: 'data:image/png;base64,' + userImg,
      stage: 'quick'
    })
  });
  console.log(`Response received in ${Date.now() - t0}ms, status: ${res.status}`);
  const data = await res.json();
  console.log('Success:', data.success);
  console.log('Detected part:', data.summary?.detectedPartType);
  console.log('Catalog availability:', data.summary?.catalogAvailability);
  console.log('Matched products count:', data.matchedProducts?.length);
  if (data.matchedProducts && data.matchedProducts.length > 0) {
    console.log('Top match:');
    console.log(' - Name:', data.matchedProducts[0].name);
    console.log(' - Code:', data.matchedProducts[0].code);
    console.log(' - Verdict:', data.matchedProducts[0].visualVerdict);
    console.log(' - Verdict Farsi:', data.matchedProducts[0].visualVerdictFarsi);
    console.log(' - Score:', data.matchedProducts[0].similarityScore);
    console.log(' - Explanation:', data.matchedProducts[0].visualExplanation);
  }
  if (data.rejectedCandidates && data.rejectedCandidates.length > 0) {
    console.log('Rejected candidates count:', data.rejectedCandidates.length);
    console.log(' - 1st rejected:', data.rejectedCandidates[0].name, 'Verdict:', data.rejectedCandidates[0].visualVerdict);
  }
}

main().catch(console.error);
