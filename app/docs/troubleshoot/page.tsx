import Link from "next/link";
import Image from "next/image";

export default function TroubleshootingPage() {
  return (
    <div className="mt-16 ml-16 prose lg:prose-xl dark:prose-invert">
      <h1>Errors and Info</h1>

      <h2>Installation</h2>

      <h3>
        d3dx9 error - install this &gt;
        <a href="https://www.microsoft.com/en-us/download/details.aspx?id=35">
          directx installer
        </a>
      </h3>
      <p>Install the DirectX installer to resolve d3dx9 errors.</p>
      <br />
      <h3>Error 1603 or 1722</h3>
      <p>
        Verify you have all drivers installed and up to date via optional
        Windows updates. Open CMD as an administrator and run the command "sfc
        /scannow" to check for repairable Windows system errors.
      </p>
      <br />
      <h3>Error "xlive.dll not found"</h3>
      <p>
        Verify that the Games for Windows Live installer was extracted before
        installing.
      </p>
      <ul>
        <li>Open "services.msc" from the start menu search bar.</li>
        <li>
          Right-click and start "Xbox Live Networking Service" or restart the
          game.
        </li>
      </ul>
      <br />
      <h3>Error 0x80072746</h3>
      <ul>
        <li>Open "services.msc" from the start menu search bar.</li>
        <li>
          Right-click and start "Windows License Manager Service" or restart the
          game (potentially conflicts with VPN to activate, though,
          unconfirmed).
        </li>
      </ul>
      <br />
      <h3>Error Ordinal 43</h3>
      <p>Re-extract and reinstall GFWL components.</p>
      <br />
      <h3>Error unable to create Direct3D Device</h3>
      <p>
        Install DirectX or update missing/outdated drivers. Test with the
        compatibility tool provided.
      </p>
      <br />
      <h3>Error 0x8007065b</h3>
      <p>
        Microsoft server account issue. Create a new free account and try the
        original account after a day or so.
      </p>
      <br />
      <h3>Xbox Login Issues</h3>
      <ul>
        <p>Disable 2FA</p>
        <p>Turn off VPN</p>
        <p>Add GFWL & Shadowrun to firewall exceptions</p>
        <p>
          Uninstall GFWL and try reinstalling it in Windows 7 compatibility mode
        </p>
        <p>Verify open NAT status</p>
        <p>Password could be too long (max pass length 11-16 characters)</p>
        <p>Xbox account changes can be delayed 10ish minutes to update</p>
        <p>
          Sign out of Xbox Game Bar/Xbox app, sign back in, and retry on
          Shadowrun
        </p>
        <p>
          Open services.msc and restart 'Windows License Manager' and 'Xbox Live
          Networking Service'
        </p>
        <p>
          Update Windows & optional Windows updates for driver/security updates
        </p>
        <p>Restart PC</p>
        <p>
          Create a new gamertag on Xbox.com (doesn't even require email
          verification) & add other profile after activation
        </p>
      </ul>
      <br />
      <h3>Activation</h3>
      <p>
        The first time you activate may take up to 20 minutes to load the key
        entry page after logging in.
      </p>
      <p>If you get the error "This key has been used too many times":</p>
      <ul>
        <p>Click "Retry"</p>
        <p>
          Wait for 5-10 minutes for the window to pop up to allow you to type in
          your newly acquired key. (Not sure why this step takes so long, if you
          believe it fully crashed use win key + tab and drag Shadowrun to a 2nd
          desktop this allows you to open task manager and end the process)
        </p>
      </ul>
      <br />
      <h3>Game Performance</h3>
      <p>
        If the pre-installed version in{" "}
        <a href="https://discord.com/channels/930362820627943495/935953977768558602">
          PC Install Guide
        </a>{" "}
        won't launch, then graphics drivers or associated software need updating
        for up-to-date Vulkan compatibility.
      </p>
      <p>
        You can check if your hardware is compatible{" "}
        <a href="https://vulkan.gpuinfo.org/listdevices.php?platform=windows">
          here
        </a>{" "}
        or with this{" "}
        <a href="https://github.com/skeeto/vulkan-test/releases/download/1.0.2/vulkan_test.exe">
          compatibility test tool
        </a>
        .
      </p>
      <p>
        Make sure you have up-to-date drivers and Geforce Experience for Nvidia.
      </p>
      <p>
        AMD may require updated software from{" "}
        <a href="https://www.amd.com/en/support">
          https://www.amd.com/en/support
        </a>{" "}
        to receive up-to-date drivers.
      </p>
      <p>
        If frames are not limiting even though you have dxvk.conf in your game
        folder, verify the file wasn't saved as dxvk.conf.txt (file save as
        change Save as type: to All Files).
      </p>
      <p>
        If all else fails, remove d3d9.dll from the game folder and install the
        out-of-date pink screen fix.
      </p>
      <br />
      <h2>NVIDIA GPUs - Nvidia Control Panel Settings</h2>
      <p>
        {" "}
        Make sure you have an up to date Geforce Experience and GPU driver{" "}
      </p>

      <p>
        Laptops: make sure your GPU is selected and not on board graphics in the
        drop down menu: Open nvidia control panel manage 3d settings program
        settings add shadowrun.exe
      </p>

      <p>
        Required if not using dxvk.conf/preinstalled: -Background Max Frame Rate
        - same as Max Frame Rate -Max Frame Rate - up to 98 (subtle game physics
        break over this value) -Verical Sync - Off* verify Vertical Sync is
        disabled in the in game advanced video settings as well
      </p>

      <p>
        For max graphics quality include: Anisotropic Filtering - 16x
        Antialiasing Mode - Enhance the application setting Antialiasing Setting
        - 8x Antialiasing Transparancy - 8x supersample (big difference on glass
        floors)
      </p>

      <p>
        Optional recommendations: -Power Management Mode - Prefer Maximum
        Performance
      </p>

      <br />
      <h2>Getting the game</h2>
      <p>Q. How can I play the game on PC?</p>
      <p>A. Follow the PC install guide</p>

      <p>Q. How can I play the game on Xbox?</p>
      <p>
        A. You need to either own a physical copy of Shadowrun, or purchase it
        digitally for $14.99 on the Microsoft Store
      </p>

      <p>Q. Do I need Xbox Live in order to play on Xbox?</p>
      <p>
        A. You do in order to play public matchmaking, however you do not need a
        Live membership to join a private match. (Some have mentioned they could
        not join a private game without gold) Currently the game is most active
        in private lobbies.
      </p>

      <p>Q. Do I need an Xbox Live membership/Gold to play Shadowrun on PC?</p>
      <p>
        A. No gold membership is required for PC, only key activation and a
        Xbox.com account.
      </p>

      <br />
      <h2>FPS Limiters</h2>
      <h3>Bandicam</h3>
      <p>
        Download <a href="https://www.bandicam.com/">Bandicam Free</a>
      </p>
      <p>
        After installed, under 'Home' in the side panel, change to 'Game
        Recording Mode' (controller icon) .
      </p>

      <p>
        Under 'FPS' on the side panel, at the bottom set your FPS Limit hot key
        and set whatever FPS you desire.
      </p>
      <p>
        Now once you want to change your frames in-game, press your hot key and
        it will enable/disable your FPS limit."
      </p>
      <br />
      <h3>Rivatuner/RTSS FPS Limit</h3>
      <p>
        RTSS allows you to adjust your fps limit without having to restart the
        game for the changes to take effect.
      </p>
      <p>
        Download{" "}
        <a href="https://www.guru3d.com/files-details/rtss-rivatuner-statistics-server-download.html">
          Rivatuner Statistics Server
        </a>
      </p>
      <p>Add shadowrun.exe to the program list</p>
      <p>set application detection level to high</p>
      <p>Custom Direct3D support must be OFF</p>
      <p>
        Set a framerate limit (these changes go into effect immediately, no
        restart required)
      </p>

      <br />
      <h3>DXVK.conf FPS Limit</h3>
      <p>
        The most consistent option to limit frames is by creating or editing a
        text file named "dxvk.conf" in your game folder [C:\Program Files
        (x86)\Microsoft Games\Shadowrun]
      </p>
      <p>
        The default dxvk.conf is available here with descriptions of what the
        options do
      </p>
      <p>
        tip: d3d9.presentInterval will repeat frames x number of times, which is
        super handy for games that are locked to 60 FPS, they will still run at
        60 FPS, but Vulkan will make the GPU send 120 FPS to the monitor
      </p>
      <p>it is set by either 1 = on or 0 = off</p>
      <br />
      <p>
        tip: "#" before a line in dxvk.conf disables the setting toggle but
        keeps the entered info
      </p>
    </div>
  );
}
