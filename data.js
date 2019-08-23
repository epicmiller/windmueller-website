const fs = require('fs');
const airtable = require('airtable');
const OUT = [];
airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: 'keySX4oFkytHM6PWz'
});
const base = airtable.base('appDxpq8GPRJrrYlT');
base('Directory').select({
  // Selecting the first 3 records in Grid view:
  // maxRecords: 3,
  // view: "Grid view"
}).eachPage(function page(records, fetchNextPage) {
  // This function (`page`) will get called for each page of records.

  records.forEach(function(record) {
    record.fields.key = record.id;
    OUT.push(record.fields);
    console.log('Retrieved', record.get('id'));
  });

  // To fetch the next page of records, call `fetchNextPage`.
  // If there are more records, `page` will get called again.
  // If there are no more records, `done` will get called.
  fetchNextPage();

}, function done(err) {
  if (err) { console.error(err); return; }
  fs.writeFileSync("./data.json", JSON.stringify(OUT, null, 2));
});
