import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { withErrorHandling, createError } from "@/lib/error-handling";

const errorAccordions = [
  {
    title: "Game Won't Launch",
    content: "If the game fails to start or crashes on launch",
    list: [
      "Verify game files integrity",
      "Update graphics drivers",
      "Run as administrator",
      "Check DirectX installation",
      "Verify Windows compatibility settings",
    ],
  },
  {
    title: "Performance Issues",
    content: "If you're experiencing lag or low FPS",
    list: [
      "Update graphics drivers",
      "Close background applications",
      "Check system requirements",
      "Verify game settings",
      "Run in compatibility mode",
    ],
  },
  {
    title: "Error: d3dx9 error - install this",
    content: "Install the DirectX installer to resolve d3dx9 errors.",
    href: "https://www.microsoft.com/en-us/download/details.aspx?id=35",
    link: "DirectX installer",
  },
  {
    title: "Error 1603 or 1722",
    content:
      'Verify you have all drivers installed and up to date via optional Windows updates. Open CMD as an administrator and run the command "sfc/scannow" to check for repairable Windows system errors.',
  },
  {
    title: 'Error "xlive.dll not found"',
    content:
      'Verify that the Games for Windows Live installer was extracted before installing. Open "services msc" from the start menu search bar. Right-click and start "Xbox Live Networking Service" or restart the game.',
  },
  {
    title: "Error 0x80072746",
    content:
      'Open "services msc" from the start menu search bar. Right-click and start "Windows License Manager Service" or restart the game (potentially conflicts with VPN to activate, though, unconfirmed).',
  },
  {
    title: "Error Ordinal 43",
    content: "GFWL wasn't extracted properly.",
    list: ["Re-extract and reinstall GFWL."],
  },
  {
    title: "Error Unable to create Direct3D Device",
    list: [
      "Install DirectX or update missing or outdated drivers.",
      "Test with the compatibility tool provided.",
    ],
  },
  {
    title: "Error 0x8007065b",
    content: "Microsoft server account issue.",
    list: [
      "Create a new free account at Xbox.com and login with it.",
      "Try signing into the original account after a day or so.",
    ],
  },
  {
    title: "Xbox Login Issues",
    content: "Various fixes you can try.",
    list: [
      "Disable 2FA",
      "Turn off VPN",
      "Add GFWL & Shadowrun to firewall exceptions",
      "Uninstall GFWL and try reinstalling it in Windows 7 compatibility mode",
      "Verify open NAT status",
      "Password could be too long (max pass length 11-16 characters)",
      "Xbox account changes can be delayed 10ish minutes to update",
      "Sign out of Xbox Game Bar/Xbox app, sign back in, and retry on Shadowrun",
      "Open services.msc and restart 'Windows License Manager' and 'Xbox Live Networking Service'",
      "Update Windows & optional Windows updates for driver/security updates",
      "Restart PC",
      "Create a new gamertag on Xbox.com (doesn't even require email verification) & add other profile after activation",
    ],
  },
  {
    title: "Error Need Multiplayer Enabled",
    content:
      "Xbox settings - system - storage devices - clear local Xbox 360 storage",
  },
  {
    title: "Controller doesn't work in-game",
    content:
      "Return to the game's main menu screen. Go to Settings > Gamepad and set the input as 'Gamepad'. This MUST be changed in the main menu settings and cannot be changed mid-game.",
  },
  {
    title: "Controller Support",
    content:
      "Xbox controllers are supported natively. For ALL controllers (including Xbox):",
    list: [
      "Must be configured in the main menu's Gamepad settings",
      "Cannot switch between Gamepad and Mouse & Keyboard during a match",
      "Settings changes must be done from the main menu",
      "For PlayStation controllers, use Steam's controller configuration",
    ],
  },
];

// GET endpoint to check status
export const GET = withErrorHandling(async (req: NextRequest) => {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const existingCount = await db.collection("FAQs").countDocuments();
  
  return NextResponse.json({
    exists: existingCount > 0,
    count: existingCount,
    message: existingCount > 0 
      ? `There are ${existingCount} FAQs in the database. Use POST to import (will only work if collection is empty).`
      : "No FAQs found. Use POST to import FAQs.",
  });
});

// POST endpoint to import FAQs
export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!isAuthorizedAdmin(session)) {
    throw createError.forbidden("Only admins can import FAQs");
  }

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  // Check if FAQs already exist
  const existingCount = await db.collection("FAQs").countDocuments();
  if (existingCount > 0) {
    return NextResponse.json({
      success: false,
      message: "FAQs already exist. Delete existing FAQs first or use the update endpoint.",
      count: existingCount,
    });
  }

  // Transform the FAQs to match our schema
  const faqs = errorAccordions.map((faq, index) => ({
    title: faq.title,
    content: faq.content || "",
    list: faq.list || [],
    href: faq.href || "",
    link: faq.link || "",
    category: "errors",
    order: index,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  // Insert FAQs into the collection
  const result = await db.collection("FAQs").insertMany(faqs);

  return NextResponse.json({
    success: true,
    message: `Successfully imported ${result.insertedCount} FAQs`,
    count: result.insertedCount,
  });
});
