

const express = require('express');
const http = require('http');
const cors = require('cors'); // Import the cors middleware
const { Server } = require("socket.io");

const fs = require("fs");
const path = require("path");
const { cwd } = require('process');
const { exec } = require('child_process');

const app = express();


app.use(express.json());

const server = http.createServer(app); // Create an HTTP server
const io = new Server(server,{
    cors: {
        // origin: ioWhiteList,
        credentials: false,
      },
});

const port = process.env.PORT || 5326;
var env = process.env.NODE_ENV || 'development';



app.get('/', (req, res) => {
  res.status(200).send("Ilabs server is up and running....") // Create an HTML file for the WebSocket client
});

app.post('/build_bin', (req, res) => {

  var message = JSON.parse(req.body)

  
  var projectName = "buildino";
  var content = message.content||"hello";

     try {
        const folderPath = path.join(cwd(), 'sketch', projectName);
        const filePath = path.join(folderPath, projectName + '.ino');
  
        var runBuild = () => {
          const child = exec(
            `arduino-cli compile -b esp32:esp32:esp32 --export-binaries=true --output-dir=out/${projectName} ./sketch/${projectName}/${projectName}.ino`,
          );
          const progress = (data) => {
            // io.emit('build_progress', data);
          };
          child.stdout.on('data', data => {
            progress(data);
          });
  
          child.stderr.on('data', data => {
            progress(data);
          });
  
          child.on('exit', (code, signal) => {
            // the child process has exited
            if (code === 0) {
              const filepath = path.join(cwd(), 'out', projectName, projectName + '.ino.bin');
              const buffer = fs.readFileSync(filepath);
              // io.emit('build_success', 'Build Success', Array.from(buffer));
             res.status(200).send(Array.from(buffer))
              
            } else {
             res.status(400).send('Build Failed with code ' + code)
            }
          });
          child.on('error', err => {
            res.status(400).send(err)
          });
        };
  
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
  
      //   if (!fs.existsSync(filePath)) {
          fs.writeFile(filePath, content, err => {
            if (err) {
              res.status(400).send(err.message)
            } else {
              console.log('File created successfully');
              runBuild();
            }
          });
      //   } else {
      //     runBuild();
  
      //     console.log('File already exists');
      //   }
      } catch (e) {
        console.log(e);
  res.status(400).send(e.message) // Create an HTML file for the WebSocket client

      }
    

});





io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle events when a user sends a message
  socket.on('build_bin', (message) => {
    console.log(`Message: ${JSON.stringify(message)}`);

    var projectName = "buildino";
    var content = message.content||"hello";

       try {
          const folderPath = path.join(cwd(), 'sketch', projectName);
          const filePath = path.join(folderPath, projectName + '.ino');
    
          var runBuild = () => {
            const child = exec(
              `arduino-cli compile -b esp32:esp32:esp32 --export-binaries=true --output-dir=out/${projectName} ./sketch/${projectName}/${projectName}.ino`,
            );
            const progress = (data) => {
              io.emit('build_progress', data);
            };
            child.stdout.on('data', data => {
              progress(data);
            });
    
            child.stderr.on('data', data => {
              progress(data);
            });
    
            child.on('exit', (code, signal) => {
              // the child process has exited
              if (code === 0) {
                const filepath = path.join(cwd(), 'out', projectName, projectName + '.ino.bin');
                const buffer = fs.readFileSync(filepath);
                io.emit('build_success', 'Build Success', Array.from(buffer));
              } else {
                io.emit('build_error', 'Build Failed with code ' + code);
              }
            });
            child.on('error', err => {
              io.emit('build_error', err);
            });
          };
    
          if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
          }
    
        //   if (!fs.existsSync(filePath)) {
            fs.writeFile(filePath, content, err => {
              if (err) {
                io.emit('build_error', err.message);
              } else {
                console.log('File created successfully');
                runBuild();
              }
            });
        //   } else {
        //     runBuild();
    
        //     console.log('File already exists');
        //   }
        } catch (e) {
          console.log(e);
          io.emit('build_error', e.message);
        }
      


  });

  // Handle events when a user disconnects
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });

});






server.listen(port, () => {
    if (env === 'production') {
        axios
          .get(
            'https://api.telegram.org/bot6032781840:AAGKLc7cRkWKjGkLxNorzTXSa_Ca9kZI0AU/sendMessage?chat_id=-1001861951455&text=ILabs server is up and running',
          )
          .then(() => {})
          .catch(e => {
            console.error(e);
          });
      }

  console.log(`=================================`);
  console.log(`======= ENV: ${env} =======`);
  console.log(`🚀 App listening on the port ${port}`);
  console.log(`=================================`);
});
