const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const puppeteer = require('puppeteer');
const fs = require('fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

var mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration : true,
      contextIsolation: false,
      enableRemoteModule: true,
    }
  });
  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  // // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

const generate = async (urlLink, rolls, numberOfSubjects, outputFile) => {
  try {
    const browser = await puppeteer.launch();
    const jntupage = await browser.newPage();
    var fetched = [], unfetched = [];
    
    fs.writeFileSync('marks.txt', "");
    for (var roll in rolls) { 
    await jntupage.goto(urlLink);
    await jntupage.type('#ht',rolls[roll]);
    await jntupage.click('input.ci');
    await jntupage.waitForTimeout(1000);
    const innertext = await jntupage.evaluate( () => document.querySelector('#rs').innerText); 
      if(innertext.length > 91) {
        fetched = fetched.concat(rolls[roll]);
        fs.appendFileSync( 'marks.txt', innertext );
      } else {
      unfetched = unfetched.concat(rolls[roll]);
      }
      mainWindow.webContents.send("status", [roll, rolls.length]);
    }
    await browser.close();
    console.log("Marks are fetched to marks.txt successfully..!");
    await exportToExcel(numberOfSubjects, outputFile);
    console.log("exported to excel successfully..!");
    try { fs.unlinkSync('marks.txt'); 
      console.log("Deleted the temp file ..! ");
  } catch (e) { }
    return [fetched, unfetched];
  } catch(err) { console.log(err); }
}

const exportToExcel = async (numberOfSubjects, outputFile) => {
  const fileStream = fs.readFileSync('marks.txt', 'ascii');
  const dataLines = fileStream.split('\n');
  var incrementer = numberOfSubjects + 3;
  var writestream = fs.createWriteStream(outputFile+".xls");

  for(var i=0; i<dataLines.length-1; ) {
    var firstLine = dataLines[i].split(':');
    var roll = firstLine[1].split('B')[0];
    var marks = [firstLine[firstLine.length-1]];

    for(var j= i+3; j<i+incrementer; j++) {
      var marksLine = dataLines[j].split('\t').splice(-6);
      marks = marks.concat(marksLine);
    }
    i += incrementer;
    var writeableData = roll;
    for(each in marks) {
      writeableData += "\t" + marks[each];
    }
    writeableData += '\n';
    writestream.write(writeableData); 

  }
  
}



const rendererCallables = {
  "generate" : generate
};

ipcMain.handle('call', async (event, method, ...args) => {
  let returnValue;
  console.log(`handling call ${method}`)
  const callable = rendererCallables[method];
  if (typeof callable === "function") {
    returnValue = await rendererCallables[method](...args);
  }
  return returnValue;
})
