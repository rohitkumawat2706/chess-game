const express=require("express");
const socket=require("socket.io");
const http =require("http");
const { Chess } =require("chess.js");
const path =require("path");

const app=express();

const server = http.createServer(app);    //link the express and socket
const io = socket(server);

const chess=new Chess();
let players={};
let currentPlayer="W";

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));

app.get("/",(req,res)=>{
    res.render("index",{title: "Chess Game"});
});

io.on("connection",function(uniquesocket){
    console.log("connected", uniquesocket.id);

    if(!players.white){
        players.white=uniquesocket.id;
        uniquesocket.emit("playerRole","w");
    }
    else if(!players.black){
        players.black=uniquesocket.id;
        uniquesocket.emit("playerRole","b");
    }
    else{
        uniquesocket.emit("spectatorRole");
    }

    uniquesocket.emit("boardState", chess.fen());

    uniquesocket.on("disconnect",function(){
        if(uniquesocket.id == players.white){
            delete players.white;
        }
        else if(uniquesocket.id==players.black){
            delete players.black;
        }

         // Optional: reset game when someone leaves
        // chess.reset();
        // io.emit("boardState", chess.fen());

        // Reset ONLY when actual players leave.
        uniquesocket.on("disconnect", function () {

            let playerLeft = false;

            if (uniquesocket.id === players.white) {
                delete players.white;
                playerLeft = true;
            }
            else if (uniquesocket.id === players.black) {
                delete players.black;
                playerLeft = true;
            }

            // Reset only if actual player left
            if (playerLeft) {
                chess.reset();
                io.emit("boardState", chess.fen());
            }
        });
    });

    uniquesocket.on("move",(move)=>{
        try{
            if(chess.turn()==='w' && uniquesocket.id!==players.white) return;
            if(chess.turn()==="b" && uniquesocket.id!==players.black ) return;

            const result = chess.move(move);
            if(result){
                currentPlayer=chess.turn();
                io.emit("move",move); 
                io.emit("boardState",chess.fen());
            }
            else{
                // console.log("Invalid Move: ",move);
                uniquesocket.emit("invalidMove",move);
            }
        }
        catch(err){
            console.log(err);
            uniquesocket.emit("Invalid move:",move);
        }
    })
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});



// io.on("connection",function(uniquesocket){
//     console.log("connected");

//     uniquesocket.on("disconnect",function(){
//         io.emit("disconnected");
//     })
// })

// io.on("connection",function(uniquesocket){
//     console.log("connected");

//     uniquesocket.on("churan",function(){
//         io.emit("churan recieved");
//     })
// })