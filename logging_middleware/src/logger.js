import axios from "axios";
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJhcnJvaGlzcml2YXN0YXZhMEBnbWFpbC5jb20iLCJleHAiOjE3Nzg5MzI0MjEsImlhdCI6MTc3ODkzMTUyMSwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjY3Njc3MWU3LWJkMWMtNDJkMC1iN2Y0LTg5MzJlMmFkZjdiMyIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6ImFycm9oaSBzcml2YXN0YXZhIiwic3ViIjoiNWE2NDJhNDQtOGZmOC00YTVjLTllY2YtOTJjNzE0ZGQ2M2QwIn0sImVtYWlsIjoiYXJyb2hpc3JpdmFzdGF2YTBAZ21haWwuY29tIiwibmFtZSI6ImFycm9oaSBzcml2YXN0YXZhIiwicm9sbE5vIjoiMjJtaW0xMDAzMSIsImFjY2Vzc0NvZGUiOiJTZkZ1V2ciLCJjbGllbnRJRCI6IjVhNjQyYTQ0LThmZjgtNGE1Yy05ZWNmLTkyYzcxNGRkNjNkMCIsImNsaWVudFNlY3JldCI6IlFkRktXdVFVSnljQ2preHEifQ.sR-7gRWXnZ5V_WyUb5J2SoU8hiJZXGuRlZjsmOzSJ6k"; // replace after registration
const LOG_URL = "http://4.224.186.213/evaluation-service/logs";
export async function Log(stack, level, pkg, message) {
    try {
        await axios.post(LOG_URL, { stack, level, package: pkg, message }, {
            headers: {
                Authorization: `Bearer ${AUTH_TOKEN}`,
                "Content-Type": "application/json"
            }
        });
    }
    catch (err) {
        // never let logging crash your app
        console.error("[Logger Error]", err);
    }
}
