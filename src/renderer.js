const { ipcMain } = require("electron");
const { ipcRenderer } = require("electron/renderer");
const readXlsxFile = require('read-excel-file');


var rollNumbers = [];

const generateResults = async () => {
    document.getElementById("generateButton").innerText = "Loading . . .";
    document.getElementById("progressDiv").classList.remove('is-hidden');
    beautifyRollNumbers([], "fetchedRollNumbers");
    beautifyRollNumbers([], "unfetchedRollNumbers");
    var urlLink = document.getElementById("urlLink").value;
    var numberOfSubjects = document.getElementById("numberOfSubjects").value;
    numberOfSubjects =  parseInt(numberOfSubjects)
    var outputFile = document.getElementById("outputFile").value;
    const res = await ipcRenderer.invoke("call", "generate", urlLink, rollNumbers, numberOfSubjects, outputFile);
    beautifyRollNumbers(res[0], "fetchedRollNumbers");
    beautifyRollNumbers(res[1], "unfetchedRollNumbers");
    document.getElementById("progressDiv").classList.add('is-hidden');
    document.getElementById("generateButton").innerText = "Generate Results"; 

  }

const readExcelFile = (file) => {
  readXlsxFile(file, {getSheets : true}).then((sheets) => {
    var options = ""
    sheets.forEach((each) => {
      options += `<option>${each.name}</option>`;
    });
    document.getElementById("sheetNames").innerHTML = options;
    readExcelSheet(file, sheets[0].name);
    
  });
}

const readExcelSheet = (file, sheetname) => {
  readXlsxFile(file, { sheet : sheetname } ).then((rows) => {
    var options = "";
    rows[0].forEach((each) => {
      options += `<option>${each}</option>`;
    });
    document.getElementById("columnNames").innerHTML = options;
    getRolls(file, sheetname, rows[0][0]);
  });
} 

const getRolls = (file, sheetName, columnName) => {
  readXlsxFile(file, {sheet: sheetName}).then((rows) => {
    var columnIndex;
    for(var i=0; i<rows[0].length; i++) {
      if( columnName == rows[0][i] ) {
        columnIndex = i;
        break;
      }
    }
    rollNumbers = [];
    for(var i=1; i<rows.length; i++) {
      if(rows[i][columnIndex] != null) {
       rollNumbers.push(rows[i][columnIndex]);
      }
    }
    beautifyRollNumbers(rollNumbers, "allRollNumbers");
  }); 
} 

const beautifyRollNumbers = (rollNumbers, boxid) => {
  var allColumns = "";
  var newColumn = '<div class="colbox">\n';

  for(var i=0, count=0; i<rollNumbers.length; i++) {
    if(count == 10) {
      newColumn += "</div>\n";
      allColumns += newColumn;
      newColumn = '<div class="colbox">\n';
      newColumn += `<span class="mytag">${rollNumbers[i]}</span>\n`;
      count = 1;
    } else {
      newColumn += `<span class="mytag">${rollNumbers[i]}</span>\n`;
      count += 1;
    }
  }
  newColumn += "</div>\n"
  allColumns += newColumn;
  document.getElementById(boxid).innerHTML = allColumns;

}

ipcRenderer.on("status", (event,data) => {
  var progressBar = document.getElementById("progressBar");
  progressBar.value = data[0].toString();
  progressBar.max = data[1].toString();
  document.getElementById("stats").innerText = `${data[0]}/${data[1]}`;
});