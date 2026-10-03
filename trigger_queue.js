async function main() {
  try {
    const res = await fetch('http://localhost:3000/api/process-queue');
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e);
  }
}
main();
