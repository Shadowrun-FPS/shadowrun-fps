export default function InstallationPage() {
  return (
    <div className="ml-8 prose lg:prose-xl dark:prose-invert">
      <h1>Installation Guide</h1>

      <h2>Preface</h2>
      <p>
        Trouble Installing? Please use the following channels if you are having
        issues installing:
      </p>
      <ul>
        <li>
          ⁠
          <a href="https://discord.com/channels/930362820627943495/1106078455226957854">
            errors-and-info
          </a>{" "}
          - General error and info FAQ
        </li>
        <li>
          ⁠
          <a href="https://discord.com/channels/930362820627943495/938788090087088168">
            troubleshoot-chat
          </a>{" "}
          - General Troubleshooting discussions
        </li>
        <li>
          ⁠
          <a href="https://discord.com/channels/930362820627943495/1042564057481363476">
            support-ticket
          </a>{" "}
          - Still having issues? Create a ticket here
        </li>
      </ul>
      <br />
      <h2>File Archiver</h2>
      <p>
        In order to extract any ".7z" file, download and install:
        <a href="https://www.7-zip.org/a/7z2201-x64.exe">7-Zip</a> or{" "}
        <a href="https://github.com/peazip/PeaZip/releases/download/8.9.0/peazip-8.9.0.WIN64.exe">
          Peazip
        </a>
      </p>
      <p>
        <b>
          <u>Extracting with Winrar is known to cause issues.</u>
        </b>
      </p>
      <br />
      <h2>FPS Limitations</h2>
      <p>
        Parts of the game malfunction when the fps is not limited. See the Limit
        FPS section under In Game Preferences below.
      </p>
      <br />
      <h2>Free Installation Guide</h2>
      <br />
      <h3>Step 1:</h3>
      <p>
        Download & Install:{" "}
        <a href="https://community.pcgamingwiki.com/files/file/1012-microsoft-games-for-windows-live/?do=download&r=3736&confirm=1&t=1&csrfKey=72a35fbfd8ae582fe891f867e376ddcc">
          Games For Windows Live
        </a>
      </p>
      <ul>
        <li>Extract the folder</li>
        <li>
          Run <u>"gfwllivesetup.exe"</u>
        </li>
        <li>
          <em>
            The GFWL program will launch showing "Connection Error." This is to
            be expected and can be ignored. You DO NOT need to launch this
            program after installing!
          </em>
        </li>
      </ul>
      <br />
      <h3>Step 2:</h3>
      <p>
        Download:{" "}
        <a href="https://mega.nz/file/5LdjgJQY#XMIClDPN0j0p7FrjNTGL3518OU3nrJl-xCA5W5jZZcg">
          Shadowrun - DXVK (2.3).zip
        </a>{" "}
        version of the Pre-installed and updated game
      </p>
      <ul>
        <li>
          Open "Shadowrun DXVK (2.3).zip" and drag and drop or extract the
          Shadowrun folder contained inside
        </li>
      </ul>
      <br />
      <h3>Step 3:</h3>
      <p>Launch Shadowrun.exe</p>
      <p>
        Then sign in to your Microsoft account by pressing home or fn+home on
        the keyboard (This is any account that can log in to{" "}
        <a href="https://www.xbox.com/">Xbox.com</a>)
      </p>
      <p>
        Enter your key when prompted. First time login/activation loading circle
        may take 5-20 minutes (see "Getting a key" section below)
      </p>
      <br />
      <h3>Step 4:</h3>
      <p>Configure Resolution and In-game advanced video settings</p>
      <p>
        While the other settings are up to your preferences of detail, quality,
        and performance, it is important to set "Vertical Sync" to Disabled in
        the in-game's Advanced Video settings
      </p>
      <img
        src="https://i.imgur.com/ijW7dFg.png"
        alt="Installation Guide Image"
        style={{ width: "40%" }}
      />

      <br />

      <h2>Getting a key</h2>
      <p>
        If you do not have an old GFWL key laying around, you can purchase{" "}
        <a href="https://store.steampowered.com/app/15620/Warhammer_40000_Dawn_of_War_II/">
          Warhammer 40,000: Dawn of War II
        </a>{" "}
        from steam to use its GFWL key to activate Shadowrun. This is possible
        because specific GFWL games can cross authenticate each other :: see{" "}
        <a href="https://discord.com/channels/930362820627943495/1106078455226957854/1106080395352604723">
          FAQ
        </a>
      </p>
      <img
        src="https://cdn.cloudflare.steamstatic.com/steam/apps/15620/header.jpg?t=1632305419"
        alt="Installation Guide Image"
        style={{ width: "30%" }}
      />
      <br />
      <p>
        <strong>Once Purchased</strong>
      </p>
      <ul>
        <li>No installation is required</li>
        <li>In your Steam Library, right-click on your newly purchased game</li>
        <li>Go to manage - CD keys</li>
        <li>Copy the Legacy GFWL key</li>
      </ul>
      <p>
        <strong>How many uses can I get out of a key?</strong>
      </p>
      <p>
        It is theorized that each individual key can be used between 10-15 times
        with no ties to account or computer. This means you can share your key
        with anyone until the key is permanently used up.
      </p>
      <p>
        For further key details, see{" "}
        <a href="https://discord.com/channels/930362820627943495/1106078455226957854/1106080395352604723">
          PC Key Activation
        </a>
      </p>
      <br />
      <h2>
        <strong>Sharing Keys</strong>
      </h2>
      <p>
        A channel for sharing keys. You can give a shout if you notice a key has
        been all used up. Feel free to leave one!{" "}
        <a href="https://canary.discord.com/channels/930362820627943495/1130511102938194063">
          PC Key Activation
        </a>{" "}
      </p>
    </div>
  );
}
