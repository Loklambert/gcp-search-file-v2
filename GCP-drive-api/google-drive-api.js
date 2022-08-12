const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const { file } = require('googleapis/build/src/apis/file');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly','https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

function searchFiles(req, res){
  // Load client secrets from a local file.
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Drive API.
    authorize(JSON.parse(content), listFiles, req.query.q, res);
  });
}

// function downloadByFileid(fileId){
//   // Load client secrets from a local file.
//   fs.readFile('credentials.json', (err, content) => {
//     if (err) return console.log('Error loading client secret file:', err);
//     // Authorize a client with credentials, then call the Google Drive API.
//     authorize(JSON.parse(content), downloadFile, fileId);
//   });
// }

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, key, response) {
  const {client_secret, client_id, redirect_uris} = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);
      console.log('oAuth2Client', oAuth2Client);
  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    console.log('TOKEN_PATH->token', JSON.parse(token));
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client, key, response);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth, searchKey, response) {
  const drive = google.drive({version: 'v3', auth});
   const service = google.drive({version: 'v3', auth});
  let list = [];
  const query = `fullText contains '${searchKey}' `;
  console.log(query)
  drive.files.list({
    q:[`mimeType= 'text/plain'`,`mimeType='application/rtf'`],
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    if (files.length) {
      console.log('Files:');
      files.map((file) => {
        // downloadFile(file.id,auth,searchKey)
        
        console.log(`${file.name} (${file.id})`);
        list.push(file);
        // drive.files.delete(file.id).execute();
      });
      downloadFile(list,auth,searchKey,response); 
    } else {
      console.log('No files found.');
      response.send([])
    } 
  });
  
}


 function downloadFile(list,auth,searchKey,response) {

  const service = google.drive({version: 'v3', auth});
  let fileObsArray = []
  let filellist=[]
  let result=[]
  for ( var obj of list){
    console.log(obj.id)
    try {
     const fileObs = service.files.get({
      fileId: obj.id,
      alt: 'media',
    });
    fileObsArray.push(fileObs)
  } catch (err) {
    // TODO(developer) - Handle error
    throw err;
  }
  }
  console.log("loook here",fileObsArray)
  Promise.all(fileObsArray).then((responseArray)=>{

  
  responseArray.forEach(x=>{
    const re = new RegExp(searchKey, 'i')
    let search= re.exec(x.data)
    
    if( search !== null){ 
     filellist.push(x.config.url)
    }
  })
  
  for ( var id in filellist){
    console.log('first',filellist[id])
    list.map( fileCheck =>
    {
      console.log('second',fileCheck)
      if(filellist[id].includes(fileCheck.id)){
        
        result.push(fileCheck)
      }
    })
  }
  
  response.send(result)
  })
  
};


module.exports = {
  SCOPES,
  listFiles,
  searchFiles,
  
};
