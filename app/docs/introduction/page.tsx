import Link from "next/link";
import Image from "next/image";
import React from "react";
import { DocHero } from "@/components/doc-hero";

export default function IntroductionPage() {
  return (
    <div className="flex flex-col items-center justify-center ">
      <div className="mx-auto mt-12 md:px-6">
        <section className="mb-8 text-center">
          <h2 className="mb-12 text-3xl font-bold">
            Meet the{" "}
            <u className="text-primary dark:text-primary-400">
              Community Support Team
            </u>
          </h2>
          <h1 className="mb-12 text-3xl font-bold">Admins</h1>
          <div className="grid grid-cols-2 lg:gap-xl-12 gap-x-6 sm:gap-x-0 md:grid-cols-3 xl:grid-cols-6">
            <div className="mb-12 hover:scale-110">
              <Image
                src="/siris.png"
                className="mx-auto mb-4 rounded-full shadow-lg max-w-none dark:shadow-black/20"
                alt=""
                width={120}
                height={100}
              />

              <p className="mb-2 font-bold">Siris</p>
              <p className="text-neutral-500 dark:text-neutral-300">
                Founder/Oh Brother
              </p>
            </div>

            <div className="mb-12 hover:scale-110">
              <Image
                src="/bumjamas.png"
                className="mx-auto mb-4 rounded-full shadow-lg max-w-none dark:shadow-black/20"
                alt=""
                width={120}
                height={100}
              />

              <p className="mb-2 font-bold">BumJamas</p>
              <p className="text-neutral-500 dark:text-neutral-300">
                Content Lord/Cameraman/Dad
              </p>
            </div>

            <div className="mb-12 hover:scale-110">
              <Image
                src="/pants.png"
                className="mx-auto mb-4 rounded-full shadow-lg max-w-none dark:shadow-black/20"
                alt=""
                width={120}
                height={100}
              />
              <p className="mb-2 font-bold">Pants</p>
              <p className="text-neutral-500 dark:text-neutral-300">
                IT Wizard
              </p>
            </div>
            <div className="mb-12 hover:scale-110">
              <Image
                src="/bagel.gif"
                className="mx-auto mb-4 rounded-full shadow-lg max-w-none dark:shadow-black/20"
                alt=""
                width={120}
                height={100}
              />
              <p className="mb-2 font-bold">$5 Bagel</p>
              <p className="text-neutral-500 dark:text-neutral-300">
                Designer/Oscar Winner/Autism Recognition Specialist
              </p>
            </div>

            <div className="mb-12 hover:scale-110">
              <Image
                src="/shubwub.png"
                className="mx-auto mb-4 rounded-full shadow-lg max-w-none dark:shadow-black/20"
                alt=""
                width={120}
                height={100}
              />
              <p className="mb-2 font-bold">ShubWub</p>
              <p className="text-neutral-500 dark:text-neutral-300">
                Bot Team/Copy Collector
              </p>
            </div>

            <div className="mb-12 hover:scale-110">
              <Image
                src="/sinful.jpg"
                className="mx-auto mb-4 rounded-full shadow-lg max-w-none dark:shadow-black/20"
                alt=""
                width={120}
                height={100}
              />
              <p className="mb-2 font-bold">Sinful Hollowz</p>
              <p className="text-neutral-500 dark:text-neutral-300">
                Mr. OCD/Troublemaker
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8 text-center">
          <h1 className="mb-12 text-3xl font-bold">Moderators</h1>
          <div className="grid grid-cols-2 lg:gap-xl-12 gap-x-6 sm:gap-x-0 md:grid-cols-3 xl:grid-cols-5">
            <div className="mb-12 hover:scale-110">
              <Image
                src="/hormel.jpg"
                className="mx-auto mb-4 rounded-full shadow-lg max-w-none dark:shadow-black/20"
                alt=""
                width={120}
                height={100}
              />
              <p className="mb-2 font-bold">Hormel</p>
              <p className="text-neutral-500 dark:text-neutral-300">
                Pot Stirrer
              </p>
            </div>

            <div className="mb-12 hover:scale-110">
              <Image
                src="/v2cain.png"
                className="mx-auto mb-4 rounded-full shadow-lg max-w-none dark:shadow-black/20"
                alt=""
                width={120}
                height={100}
              />
              <p className="mb-2 font-bold">v2 C A i N</p>
              <p className="text-neutral-500 dark:text-neutral-300">
                Laissez-faire/AWOL
              </p>
            </div>

            <div className="mb-12 hover:scale-110">
              <Image
                src="/manamystery.png"
                className="mx-auto mb-4 rounded-full shadow-lg max-w-none dark:shadow-black/20"
                alt=""
                width={120}
                height={100}
              />
              <p className="mb-2 font-bold">ManaMystery</p>
              <p className="text-neutral-500 dark:text-neutral-300">
                List Manager
              </p>
            </div>

            <div className="mb-12 hover:scale-110">
              <Image
                src="/frank.png"
                className="mx-auto mb-4 rounded-full shadow-lg max-w-none dark:shadow-black/20"
                alt=""
                width={120}
                height={100}
              />
              <p className="mb-2 font-bold">Frank</p>
              <p className="text-neutral-500 dark:text-neutral-300">
                HVAC Master/Frank
              </p>
            </div>

            <div className="mb-12 hover:scale-110">
              <Image
                src="/final.png"
                className="mx-auto mb-4 rounded-full shadow-lg max-w-none dark:shadow-black/20"
                alt=""
                width={120}
                height={100}
              />
              <p className="mb-2 font-bold">FinalForce07</p>
              <p className="text-neutral-500 dark:text-neutral-300">
                Queue Master
              </p>
            </div>

            <div className="mb-12 hover:scale-110">
              <Image
                src="/ff5ninja.gif"
                className="mx-auto mb-4 rounded-full shadow-lg max-w-none dark:shadow-black/20"
                alt=""
                width={120}
                height={100}
              />
              <p className="mb-2 font-bold">FF5Ninja</p>
              <p className="text-neutral-500 dark:text-neutral-300">Bot Team</p>
            </div>

            <div className="mb-12 hover:scale-110">
              <Image
                src="/wwm0nkey.png"
                className="mx-auto mb-4 rounded-full shadow-lg max-w-none dark:shadow-black/20"
                alt=""
                width={120}
                height={100}
              />
              <p className="mb-2 font-bold">wwm0nkey</p>
              <p className="text-neutral-500 dark:text-neutral-300">
                Microsoft Whisperer
              </p>
            </div>

            <div className="mb-12 hover:scale-110">
              <Image
                src="/shadowrungirl.png"
                className="mx-auto mb-4 rounded-full shadow-lg max-w-none dark:shadow-black/20"
                alt=""
                width={120}
                height={100}
              />
              <p className="mb-2 font-bold">Shadowrun Girl</p>
              <p className="text-neutral-500 dark:text-neutral-300">
                Never Toxic/Always Innocent
              </p>
            </div>

            <div className="mb-12 hover:scale-110">
              <Image
                src="/SRLogo.png"
                className="mx-auto mb-4 rounded-full shadow-lg max-w-none dark:shadow-black/20"
                alt=""
                width={120}
                height={100}
              />
              <p className="mb-2 font-bold">Bryman</p>
              <p className="text-neutral-500 dark:text-neutral-300">Bot Team</p>
            </div>

            <div className="mb-12 hover:scale-110">
              <Image
                src="/shwifty.png"
                className="mx-auto mb-4 rounded-full shadow-lg max-w-none dark:shadow-black/20"
                alt=""
                width={120}
                height={100}
              />
              <p className="mb-2 font-bold">Shwiftyy</p>
              <p className="text-neutral-500 dark:text-neutral-300">Shy</p>
            </div>
          </div>
          <p>
            Just a group of people passionate about the Shadowrun FPS
            volunteering their time to help provide a space for the future of
            the game and community.
          </p>
        </section>
      </div>
      {/* <!-- Section: Design Block --> */}
      <div className="mx-auto">
        <section className="mb-8">
          <h2 className="mb-12 text-3xl font-bold text-center">
            Latest articles
          </h2>

          <div className="grid gap-6 lg:grid-cols-2">
            <div
              className="relative overflow-hidden bg-no-repeat bg-cover rounded-lg shadow-lg hover:scale-105 zoom dark:shadow-black/20"
              data-te-ripple-init
              data-te-ripple-color="light"
            >
              <Image
                src="/2023NashvilleLAN.jpeg"
                className="w-full h-full align-middle transition duration-300 ease-linear"
                alt=""
                width={1000}
                height={1000}
              />
              <a href="#!">
                <div className="absolute top-0 right-0 bottom-0 left-0 h-full w-full overflow-hidden bg-[hsla(0,0%,0%,0.4)] bg-fixed">
                  <div className="flex items-end justify-start h-full">
                    <div className="m-6 text-white">
                      <h5 className="mb-3 text-lg font-bold">
                        2023 Nashville LAN
                      </h5>
                      <p>
                        <small>
                          Published <u>10-17-2023</u> by Sinful Hollowz
                        </small>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 bottom-0 left-0 h-full w-full overflow-hidden bg-fixed transition duration-300 ease-in-out hover:bg-[hsla(0,0%,99%,0.15)]"></div>
              </a>
            </div>
            <div
              className="relative overflow-hidden bg-no-repeat bg-cover rounded-lg shadow-lg hover:scale-105 dark:shadow-black/20"
              data-te-ripple-init
              data-te-ripple-color="light"
            >
              <Image
                src="/shadowrunAMA_03.png"
                className="w-full h-full align-middle transition duration-300 ease-linear"
                alt=""
                width={1000}
                height={1000}
              />
              <a
                href="https://youtu.be/SAkaQb6V5jE?si=Wi02DvBdjpU6o2wx!"
                target="_blank"
              >
                <div className="absolute top-0 right-0 bottom-0 left-0 h-full w-full overflow-hidden bg-[hsla(0,0%,0%,0.4)] bg-fixed">
                  <div className="flex items-end justify-start h-full">
                    <div className="m-6 text-white">
                      <h5 className="mb-3 text-lg font-bold">
                        FASA Studios Developer AMA Q&A
                      </h5>
                      <p>
                        <small>
                          Published <u>08-10-2023</u> by Sinful Hollowz
                        </small>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 bottom-0 left-0 h-full w-full overflow-hidden bg-fixed transition duration-300 ease-in-out hover:bg-[hsla(0,0%,99%,0.15)]"></div>
              </a>
            </div>
            <div
              className="relative overflow-hidden bg-no-repeat bg-cover rounded-lg shadow-lg hover:scale-105 dark:shadow-black/20"
              data-te-ripple-init
              data-te-ripple-color="light"
            >
              <Image
                src="/Shadowrun2017AnaheimLAN.jpeg"
                className="w-full align-middle transition duration-300 ease-linear"
                alt=""
                width={1000}
                height={1000}
              />
              <a href="#!">
                <div className="absolute top-0 right-0 bottom-0 left-0 h-full w-full overflow-hidden bg-[hsla(0,0%,0%,0.4)] bg-fixed">
                  <div className="flex items-end justify-start h-full">
                    <div className="m-6 text-white">
                      <h5 className="mb-3 text-lg font-bold">
                        2017 Anaheim LAN
                      </h5>
                      <p>
                        <small>
                          Published <u>01-22-2017</u> by Sinful Hollowz
                        </small>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 bottom-0 left-0 h-full w-full overflow-hidden bg-fixed transition duration-300 ease-in-out hover:bg-[hsla(0,0%,99%,0.15)]"></div>
              </a>
            </div>
            {/* <!-- Section: Design Block --> */}
          </div>
        </section>
      </div>
      <br />

      <div className="mt-8 text-center">
        <h2>Stay Connected</h2>
        <p>
          Follow us on social media for updates and announcements about our
          progress:
        </p>
        <ul>
          <br />
          <li>
            <a
              href="https://twitter.com/i/communities/1688188047064470011"
              target="_blank"
              rel="noopener noreferrer"
            >
              Twitter
            </a>
          </li>
          {/* <li>
            <a
              href="https://www.facebook.com/example"
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook
            </a>
          </li> */}
          {/* <li>
            <a
              href="https://www.instagram.com/example"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
          </li> */}
        </ul>
      </div>
    </div>
  );
}
