const fs = require('fs');
const airtable = require('airtable');
const OUT = [];
airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: 'keySX4oFkytHM6PWz'
});
base('Directory').replace('recuRMvfkwa6pJCHB', {
  "id": "Adam Miller",
  "firstName": "Adam",
  "lastName": "Miller",
  "email1": "adam@pages.me",
  "email2": "amiller276@yahoo.com",
  "street": "825 Post St. #524",
  "city": "San Francisco",
  "region": "CA",
  "postalCode": "94109",
  "country": "USA"
}, function(err, record) {
    if (err) { console.error(err); return; }
    console.log(record.get('id'));
});
