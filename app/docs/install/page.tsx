import Head from "next/head"; // Import Next.js Head component
import Link from "next/link";
import Image from "next/image";
import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Install Shadowrun FPS on PC | Step-by-Step Guide",
  description:
    "Learn how to install the 2007 Shadowrun FPS on PC with our detailed guide. Download links, setup instructions, and troubleshooting tips.",
  keywords: [
    "Shadowrun FPS Install",
    "How to install Shadowrun PC",
    "Shadowrun 2007 game setup",
    "Shadowrun troubleshooting",
    "Games for Windows Live Shadowrun",
  ],
  openGraph: {
    title: "Install Shadowrun FPS on PC | Easy Setup Guide",
    description:
      "Follow our simple step-by-step guide to install Shadowrun FPS on PC. Get download links, setup tips, and join the community!",
    url: "https://ShadowrunFPS.com/docs/install",
    type: "website",
    images: [
      {
        url: "/shadowrun-install-cover.jpg",
        width: 1200,
        height: 630,
        alt: "Shadowrun FPS Installation Guide",
      },
    ],
  },
};

export default function InstallationPage() {
  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "HowTo",
              name: "Install Shadowrun FPS on PC",
              description:
                "Step-by-step guide to install the 2007 Shadowrun FPS game on PC.",
              image: "https://yourwebsite.com/shadowrun-install-cover.jpg",
              totalTime: "PT15M",
              tool: ["7-Zip", "Games for Windows Live"],
              step: [
                {
                  "@type": "HowToStep",
                  name: "Download Games for Windows Live",
                  url: "https://yourwebsite.com/install#step-1",
                  image: "https://yourwebsite.com/gfwl-setup.jpg",
                  text: "Download and install Games for Windows Live. Run gfwllivesetup.exe.",
                },
                {
                  "@type": "HowToStep",
                  name: "Install Shadowrun FPS",
                  url: "https://yourwebsite.com/install#step-2",
                  image: "https://yourwebsite.com/shadowrun-zip.jpg",
                  text: "Download and extract Shadowrun - DXVK (2.3).zip. Create a desktop shortcut for Shadowrun.exe.",
                },
              ],
            }),
          }}
        />
      </Head>

      <div className="mt-8 lg:grid-cols-3 lg:flex dark:prose-invert">
        <div className="prose xl:mx-auto lg:prose-xl dark:prose-invert">
          <div
            data-te-spy="scroll"
            data-te-target="#scrollspy1"
            data-te-offset="200"
            className="relative overflow-auto h-500"
          >
            <h1 className="text-4xl font-bold">
              How to Install Shadowrun FPS on PC (2007) – Full Guide
            </h1>
            <p>
              Ready to experience Shadowrun FPS on PC? This guide will walk you
              through every step, from downloading the files to launching the
              game. Let&quot;s dive in!
            </p>

            <section id="preface">
              <article>
                <h2 className="pt-6 pb-2 text-xl font-semibold">Preface</h2>
                <p>
                  Need help? Visit our{" "}
                  <Link
                    href="/docs/troubleshoot"
                    aria-label="Visit the Troubleshooting Guide"
                  >
                    Troubleshooting Guide
                  </Link>
                  . Or join the <Link href="/community">Shadowrun Discord</Link>{" "}
                  for support.
                </p>

                <div>
                  <ul>
                    <li>
                      <Link href="/docs/troubleshoot">
                        General Errors and Info
                      </Link>
                    </li>
                    <li>
                      <Link
                        target="_blank"
                        href="discord://discord.com/channels/930362820627943495/938788090087088168"
                      >
                        Troubleshoot Chat
                      </Link>
                    </li>
                    <li>
                      <Link href="/docs/support">Support Ticket</Link>
                    </li>
                  </ul>
                </div>
              </article>
              <h2 className="mt-16 mb-0 text-3xl font-bold not-prose">
                File Archiver
              </h2>
              <p className="mt-0 mb-0">
                In order to extract any .7z file, download and install:{" "}
                <Link href="https://www.7-zip.org/a/7z2201-x64.exe">7-Zip</Link>{" "}
                or{" "}
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
                Parts of the game may malfunction if the fps is not limited. See
                the FPS Limiters section on the
                <Link
                  data-te-nav-link-ref
                  className="bg-transparent px-[5px] text-neutral-600 shadow-none dark:text-neutral-200"
                  href="/docs/troubleshoot/#fps-limiters"
                >
                  Troubleshooting Page
                </Link>
              </p>
            </section>
            <section id="install-guide">
              <h2 className="pt-5">Installation Guide</h2>
            </section>
            <section id="step-1">
              <h3 className="pt-6 pb-2 text-xl font-semibold">Step 1</h3>
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
                    When prompted, select Launch and the GFWL program will
                    launch showing Connection Error. This is to be expected and
                    can be ignored. You DO NOT need to launch this program after
                    installing!
                  </em>
                </li>
              </ul>
              <section id="step-2">
                <h3 className="pt-4 pb-2 text-xl font-semibold">Step 2</h3>
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
                    Open Shadowrun DXVK (2.3).zip and drag and drop or extract
                    the Shadowrun folder contained inside to your desired
                    location. Right-click on the Shadowrun.exe to create a
                    Shortcut and place that on your desktop.
                  </li>
                </ul>
              </section>
              <section id="step-3">
                <h3 className="pt-4 pb-2 text-xl font-semibold">Step 3</h3>
                <p>Launch Shadowrun.exe</p>
                <ul>
                  <li>
                    Once prompted, sign into your Microsoft account by pressing
                    home or fn+home on the keyboard. (This is any account that
                    can log into{" "}
                    <Link target="_blank" href="https://www.xbox.com/">
                      Xbox.com
                    </Link>
                    )
                  </li>
                </ul>
                <ul>
                  <li>
                    Enter your key when prompted. The first time
                    login/activation loading circle may take 5-20 minutes.
                    Please be patient. (see Getting a Key section below)
                  </li>
                </ul>
              </section>
              <section id="step-4">
                <h3 className="pt-4 pb-2 text-xl font-semibold">Step 4</h3>
                <p>Configure Resolution and in-game Advanced Video Settings.</p>
                <ul>
                  <li>
                    It&apos;s important to set Vertical Sync to
                    &quot;Disable&quot; in the in-game Advanced Video Settings.
                    The other settings can be changed to whatever you like, or
                    left alone.
                  </li>
                </ul>
                <Image
                  src="/shadowrunvsync.png"
                  alt="Shadowrun FPS In-Game Settings for Optimal Performance"
                  width={500}
                  height={500}
                />
              </section>
              <br />
              <section id="getting-a-key">
                <h3 className="pt-4 pb-2 text-xl font-semibold">
                  Getting a Key
                </h3>
                <p>
                  If you do not have an old GFWL key laying around, you can
                  purchase one of these games from steam to use its respective
                  GFWL key to activate Shadowrun:
                </p>
                <ul>
                  <li>
                    <Link
                      target="_blank"
                      href="https://store.steampowered.com/app/15620/Warhammer_40000_Dawn_of_War_II/"
                    >
                      Warhammer 40,000: Dawn of War II
                    </Link>
                  </li>
                  <li>
                    <Link
                      target="_blank"
                      href="https://store.steampowered.com/app/32420/STAR_WARS_The_Clone_Wars__Republic_Heroes/"
                    >
                      STAR WARS™: The Clone Wars - Republic Heroes™
                    </Link>
                  </li>
                  <li>
                    <Link
                      target="_blank"
                      href="https://store.steampowered.com/app/10460/The_Club/"
                    >
                      The Club™
                    </Link>
                  </li>
                </ul>

                <p>
                  This is possible because specific GFWL games can cross
                  authenticate each other - see{" "}
                  <Link href="/docs/troubleshoot">General Errors and Info</Link>
                </p>

                <div className="flex justify-between gap-4">
                  <Link href="https://store.steampowered.com/app/15620/Warhammer_40000_Dawn_of_War_II/">
                    <Image
                      src="/dawnofwar2.jpg"
                      alt="Warhammer Dawn of War II"
                      width={300}
                      height={200}
                      className="flex-shrink-0"
                    />
                  </Link>
                  <Link href="https://store.steampowered.com/app/32420/STAR_WARS_The_Clone_Wars__Republic_Heroes/">
                    <Image
                      src="/STARWARSRepublicHeroes.jpg"
                      alt="Star Wars Republic Heroes"
                      width={300}
                      height={200}
                      className="flex-shrink-0"
                    />
                  </Link>
                  <Link href="https://store.steampowered.com/app/10460/The_Club/">
                    <Image
                      src="/TheClub.jpg"
                      alt="The Club"
                      width={300}
                      height={200}
                      className="flex-shrink-0"
                    />
                  </Link>
                </div>
                <p>
                  <strong>Once Purchased</strong>
                </p>
                <ul>
                  <li>No installation is required</li>
                  <li>
                    In your Steam Library, right-click on your newly purchased
                    game
                  </li>
                  <li>Go to manage - CD keys</li>
                  <li>Copy the Legacy GFWL key</li>
                  <li>
                    Paste the legacy key into the GFWL Activation screen when
                    prompted
                  </li>
                </ul>
                <p>
                  <strong>How many uses can I get out of a key?</strong>
                </p>
                <p>
                  It is theorized that each individual key can be used between
                  10-15 times with no ties to account or computer. This means
                  you can share your key with anyone until the key is
                  permanently used up.
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
              </section>
            </section>
            <section id="sharing-keys">
              <h3 className="pt-4 pb-2 text-xl font-semibold">Sharing Keys</h3>
              <p>
                A channel for sharing keys has been created for the community to
                use. If you notice a key has been all used up, please alert the
                staff so it can be removed. Feel free to leave a key too if you
                would like to support the community!{" "}
                <Link
                  target="_blank"
                  href="https://discord.com/channels/930362820627943495/1233897832587595868"
                >
                  Public Key Share
                </Link>{" "}
              </p>
            </section>
          </div>
        </div>

        <div className="fixed h-16 md:right-4 top-50">
          <div
            id="scrollspy1"
            className="pl-3 text-md scroll-smooth focus:scroll-auto"
          >
            <ul data-te-nav-list-ref>
              <li className="py-1">
                <a
                  data-te-nav-link-ref
                  data-te-nav-link-active
                  className="bg-transparent px-[5px] text-neutral-600 shadow-none dark:text-neutral-200"
                  href="#preface"
                >
                  Preface
                </a>
              </li>
              <li className="py-1">
                <a
                  data-te-nav-link-ref
                  className="bg-transparent px-[5px] text-neutral-600 shadow-none dark:text-neutral-200"
                  href="#install-guide"
                >
                  Install Guide
                </a>
              </li>
              <ul data-te-nav-list-ref className="pl-3">
                <li className="py-1">
                  <a
                    data-te-nav-link-ref
                    className="bg-transparent px-[5px] text-neutral-600 shadow-none dark:text-neutral-200"
                    href="#step-1"
                  >
                    Step 1
                  </a>
                </li>
                <li>
                  <a
                    data-te-nav-link-ref
                    className="bg-transparent px-[5px] text-neutral-600 shadow-none dark:text-neutral-200"
                    href="#step-2"
                  >
                    Step 2
                  </a>
                </li>
                <li>
                  <a
                    data-te-nav-link-ref
                    className="bg-transparent px-[5px] text-neutral-600 shadow-none dark:text-neutral-200"
                    href="#step-3"
                  >
                    Step 3
                  </a>
                </li>
                <li>
                  <a
                    data-te-nav-link-ref
                    className="bg-transparent px-[5px] text-neutral-600 shadow-none dark:text-neutral-200"
                    href="#step-4"
                  >
                    Step 4
                  </a>
                </li>
              </ul>
              <li className="py-1">
                <a
                  data-te-nav-link-ref
                  className="bg-transparent px-[5px] text-neutral-600 shadow-none dark:text-neutral-200"
                  href="#getting-a-key"
                >
                  Getting a Key
                </a>
              </li>
              <li className="py-1">
                <a
                  data-te-nav-link-ref
                  className="bg-transparent px-[5px] text-neutral-600 shadow-none dark:text-neutral-200"
                  href="#sharing-keys"
                >
                  Sharing Keys
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
