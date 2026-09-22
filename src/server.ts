import "dotenv/config";
import app from "./app.js";
import {prisma} from "./lib/prisma.js";

const PORT = process.env.PORT || 5000;

async function startServer(){
    try{
        await prisma.$connect();

        console.log("Database connected");

        app.listen(PORT,()=>{
            console.log(`Server running on port ${PORT}`);
        });
    }catch(err){
        console.error("Database connection failed", err);
        process.exit(1);
    }
}

startServer();