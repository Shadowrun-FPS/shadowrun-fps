import clientPromise from "@/lib/mongodb";
import Image from "next/image";
import { Roster } from "@/types/types";

export type StaffRosters = {
  founderRoster: Roster[];
  adminRoster: Roster[];
  moderatorRoster: Roster[];
};

export async function getStaffRoster(): Promise<StaffRosters> {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const staffMembers = await db
    .collection("Staff")
    .find({ staffTitle: { $in: ["Founder", "Admin", "Moderator"] } })
    .toArray();

  const founderRoster = staffMembers.filter((roster) =>
    roster.staffTitle.includes("Founder")
  );
  const adminRoster = staffMembers.filter(
    (roster) =>
      roster.staffTitle.includes("Admin") &&
      !roster.staffTitle.includes("Founder")
  );
  const moderatorRoster = staffMembers.filter(
    (roster) =>
      roster.staffTitle.includes("Moderator") &&
      !roster.staffTitle.includes("Admin")
  );

  return {
    founderRoster: founderRoster as unknown as Roster[],
    adminRoster: adminRoster as unknown as Roster[],
    moderatorRoster: moderatorRoster as unknown as Roster[],
  };
}

export default async function StaffRoster() {
  const { founderRoster, adminRoster, moderatorRoster } =
    await getStaffRoster();
  const imageWidth = 120;
  const imageHeight = 100;
  const defaultImageSrc = "/SRlogo.png";

  return (
    <div>
      <h2 className="mb-12 text-3xl font-bold text-center">Admin</h2>
      {founderRoster.length > 0 && (
        <section>
          <div>
            {founderRoster.map((roster, index) => (
              <div key={index} className="mb-12 text-center hover:scale-110">
                <Image
                  className="mx-auto mb-4 rounded-full shadow-lg max-w-none dark:shadow-black/20"
                  src={roster.src || defaultImageSrc}
                  alt={roster.staffAltText}
                  width={imageWidth}
                  height={imageHeight}
                />
                <h5 className="mb-2 font-bold">{roster.staffName}</h5>
                <p className="text-neutral-500 dark:text-neutral-300">
                  {roster.staffNicknames}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
      {adminRoster.length > 0 && (
        <section>
          <div className="grid items-center grid-cols-2 lg:gap-xl-12 gap-x-6 sm:gap-x-0 md:grid-cols-3 xl:grid-cols-6">
            {adminRoster.map((roster, index) => (
              <div key={index} className="mb-12 text-center hover:scale-110">
                <Image
                  className="mx-auto mb-4 rounded-full shadow-lg max-w-none dark:shadow-black/20"
                  src={roster.src || defaultImageSrc}
                  alt={roster.staffAltText}
                  width={imageWidth}
                  height={imageHeight}
                />
                <h5 className="mb-2 font-bold">{roster.staffName}</h5>
                <p className="text-neutral-500 dark:text-neutral-300">
                  {roster.staffNicknames}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {moderatorRoster.length > 0 && (
        <section>
          <h2 className="mt-12 mb-12 text-3xl font-bold text-center">
            Moderator
          </h2>
          <div className="flex flex-wrap justify-center mx-auto mb-16 rounded sm:gap-x-12 gap-x-6 lg:gap-x-4 xl:gap-x-4">
            {moderatorRoster.map((roster, index) => (
              <div
                key={index}
                className="mb-12 text-center hover:scale-110"
                style={{ flex: "0 0 18%" }}
              >
                <Image
                  className="mx-auto mb-4 rounded-full shadow-lg max-w-none dark:shadow-black/20"
                  src={roster.src || defaultImageSrc}
                  alt={roster.staffAltText}
                  width={imageWidth}
                  height={imageHeight}
                />
                <h5 className="mb-2 font-bold">{roster.staffName}</h5>
                <p className="text-neutral-500 dark:text-neutral-300">
                  {roster.staffNicknames}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
      {(!adminRoster || adminRoster.length === 0) &&
        (!moderatorRoster || moderatorRoster.length === 0) && (
          <p className="text-center">No staff positions.</p>
        )}
    </div>
  );
}
