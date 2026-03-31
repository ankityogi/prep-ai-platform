const emailRegister = ` TeST_UsEr_${Date.now()}@ExaMPle.CoM `;
const emailLogin = emailRegister.trim().toLowerCase();
const password = "password123";

async function runTest() {
    console.log("Testing Registration with messy casing:", emailRegister);
    let res = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ name: " Test User ", email: emailRegister, password }).toString(),
        redirect: "manual"
    });
    
    console.log("Registration Response Status:", res.status);
    
    // Attempt Login with totally clean lowercase
    console.log("\nTesting Login with exact clean lowercase:", emailLogin);
    let loginRes = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email: emailLogin, password }).toString(),
        redirect: "manual"
    });
    
    console.log("Login Response Status:", loginRes.status);
    console.log("Login Location:", loginRes.headers.get("location"));
    
    if (loginRes.status === 302 && loginRes.headers.get("location") === "/dashboard") {
        console.log("SUCCESS! The system successfully matched the messy registration email with the lowercase login email.");
    } else {
        console.log("FAILED. Case insensitivity logic failed.", await loginRes.text());
    }
}

runTest().catch(console.error);
