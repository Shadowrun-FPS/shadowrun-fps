import Link from "next/link";
import Image from "next/image";

export default function InstallationPage() {
  return (
    <div
      className="mt-2 ml-14 lg:prose-xl dark:prose-invert outline"
      style={{
        backgroundImage: 'url("/shadowrun_invite_banner.png")', // <-- Provide the correct path
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        backgroundPosition: "right",
        width: "40%",
      }}
    >
      <div className="ml-16 prose lg:prose-xl dark:prose-invert">
        <br />
        <h1>Installation Guide</h1>
        <article>
          <h2>Preface</h2>
          <p>
            Trouble Installing? Please use the following channels if you are
            having issues installing:
          </p>
          <ul>
            <li>
              <Link href="/docs/troubleshoot">General Errors and Info</Link>
            </li>
            <li>
              <Link
                target="_blank"
                href="https://discord.com/channels/930362820627943495/938788090087088168"
              >
                Troubleshoot Chat
              </Link>
            </li>
            <li>
              <Link href="/docs/support">Support Ticket</Link>
            </li>
          </ul>
        </article>
        <h2 className="mt-16 mb-0 text-3xl font-bold not-prose">
          File Archiver
        </h2>
        <p className="mt-0 mb-0">
          In order to extract any .7z file, download and install:{" "}
          <Link href="https://www.7-zip.org/a/7z2201-x64.exe">7-Zip</Link> or{" "}
          <Link href="https://github.com/peazip/PeaZip/releases/download/8.9.0/peazip-8.9.0.WIN64.exe">
            Peazip
          </Link>
        </p>
        <p className="mt-0 not-prose">
          <b>
            <em>Extracting with Winrar is known to cause issues.</em>
          </b>
        </p>
        <h2 className="mt-16 mb-0 text-3xl font-bold not-prose">
          FPS Limitations
        </h2>
        <p className="mt-o not-prose">
          Parts of the game may malfunction if the fps is not limited. See the
          Limit FPS section under In Game Preferences below.
        </p>
        <br />
        <h2>Free Installation Guide</h2>
        <h2 className="mt-8 mb-0 text-3xl font-bold not-prose">Step 1</h2>
        <p>
          Download & Install:{" "}
          <Link href="https://community.pcgamingwiki.com/files/file/1012-microsoft-games-for-windows-live/?do=download&r=3736&confirm=1&t=1&csrfKey=72a35fbfd8ae582fe891f867e376ddcc">
            Games For Windows Live
          </Link>
        </p>
        <ul>
          <li>Extract the folder</li>
          <li>
            Run <u>gfwllivesetup.exe</u>
          </li>
          <li>
            <em>
              When prompted, select Launch and the GFWL program will launch
              showing Connection Error. This is to be expected and can be
              ignored. You DO NOT need to launch this program after installing!
            </em>
          </li>
        </ul>
        <h3>Step 2:</h3>
        <p>
          Download{" "}
          <Link
            href="https://mega.nz/file/5LdjgJQY#XMIClDPN0j0p7FrjNTGL3518OU3nrJl-xCA5W5jZZcg"
            target="_blank"
          >
            Shadowrun - DXVK (2.3).zip
          </Link>{" "}
          version of the Pre-installed and updated game.
        </p>
        <ul>
          <li>
            Open Shadowrun DXVK (2.3).zip and drag and drop or extract the
            Shadowrun folder contained inside.
          </li>
        </ul>
        <h3>Step 3:</h3>
        <p>Launch Shadowrun.exe</p>
        <ul>
          <li>
            Then sign in to your Microsoft account by pressing home or fn+home
            on the keyboard. (This is any account that can log in to{" "}
            <Link target="_blank" href="https://www.xbox.com/">
              Xbox.com
            </Link>
            )
          </li>
        </ul>
        <ul>
          <li>
            Enter your key when prompted. The first time login/activation
            loading circle may take 5-20 minutes (see "Getting a key" section
            below)
          </li>
        </ul>
        <h3>Step 4:</h3>
        <p>Configure Resolution and In-game advanced video settings.</p>
        <ul>
          <li>
            While the other settings are up to your preferences of detail,
            quality, and performance, it is important to set Vertical Sync to
            Disabled in the in-game's Advanced Video settings.
          </li>
        </ul>
        <Image
          src="/shadowrunvsync.png"
          alt="Installation Guide Image"
          width={500}
          height={500}
        />
        <br />
        <div>
          <h2>Getting a key</h2>
          <p>
            If you do not have an old GFWL key laying around, you can purchase{" "}
            <Link
              target="_blank"
              href="https://store.steampowered.com/app/15620/Warhammer_40000_Dawn_of_War_II/"
            >
              Warhammer 40,000: Dawn of War II
            </Link>{" "}
            from steam to use its GFWL key to activate Shadowrun.
          </p>{" "}
          <p>
            {" "}
            Or if you already own{" "}
            <Link
              target="_blank"
              href="https://store.steampowered.com/app/12360/FlatOut_Ultimate_Carnage/"
            >
              Flatout Ultimate Carnage
            </Link>{" "}
            on Steam, you can use its CD key to activate Shadowrun as well.
          </p>
          <p>
            This is possible because specific GFWL games can cross authenticate
            each other - see{" "}
            <Link href="/docs/troubleshoot">General Errors and Info</Link>
          </p>
          <Image
            src="/dawnofwar2.jpg"
            alt="Installation Guide Image"
            width={500}
            height={300}
          />
          <p>
            <strong>Once Purchased</strong>
          </p>
          <ul>
            <li>No installation is required</li>
            <li>
              In your Steam Library, right-click on your newly purchased game
            </li>
            <li>Go to manage - CD keys</li>
            <li>Copy the Legacy GFWL key</li>
          </ul>
          <p>
            <strong>How many uses can I get out of a key?</strong>
          </p>
          <p>
            It is theorized that each individual key can be used between 10-15
            times with no ties to account or computer. This means you can share
            your key with anyone until the key is permanently used up.
          </p>
          <p>
            For further key details, see{" "}
            <Link
              target="_blank"
              href="https://discord.com/channels/930362820627943495/1106078455226957854/1106080395352604723"
            >
              PC Key Activation
            </Link>
          </p>
          <br />
        </div>
        <div>
          <h2>
            <strong>Sharing Keys</strong>
          </h2>
          <p>
            A channel for sharing keys. You can give a shout if you notice a key
            has been all used up. Feel free to leave one!{" "}
            <Link
              target="_blank"
              href="https://discord.com/channels/930362820627943495/1130511102938194063"
            >
              Public Key Share
            </Link>{" "}
          </p>
          <br />
        </div>
      </div>
    </div>
  );
}
