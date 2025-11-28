// app/api/auth/session/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    
    // Debug: Log all cookies to see what's available
    const allCookies = cookieStore.getAll();
    console.log("All cookies:", allCookies);
    
    // Try different possible cookie names
    const possibleUserIdKeys = ['user_id', 'userId', 'id', 'session_user_id', 'nim'];
    const possibleUserNameKeys = ['user_name', 'userName', 'name', 'session_user_name', 'full_name'];
    
    let userId = null;
    let userName = null;
    
    // Check for user ID in cookies
    for (const key of possibleUserIdKeys) {
      const cookie = cookieStore.get(key);
      if (cookie) {
        userId = cookie.value;
        console.log(`Found user ID in cookie: ${key} = ${userId}`);
        break;
      }
    }
    
    // Check for user name in cookies
    for (const key of possibleUserNameKeys) {
      const cookie = cookieStore.get(key);
      if (cookie) {
        userName = cookie.value;
        console.log(`Found user name in cookie: ${key} = ${userName}`);
        break;
      }
    }
    
    if (!userId || !userName) {
      console.log("No user found in cookies");
      return NextResponse.json(
        { 
          user: null, 
          error: "Not authenticated",
          debug: {
            availableCookies: allCookies.map(c => c.name)
          }
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: userId,
        name: userName
      }
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json(
      { user: null, error: "Failed to get session" },
      { status: 500 }
    );
  }
}
