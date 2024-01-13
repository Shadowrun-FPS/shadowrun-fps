import clientPromise from "@/lib/mongodb";
import Image from "next/image";
import { staffRoster } from "@/types/types";

export type StaffRosters = {
  adminRoster: staffRoster[];
  moderatorRoster: staffRoster[];
};

export async function getStaffRoster(): Promise<StaffRosters> {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const adminRoster = await db
    .collection("Staff")
    .find({ staffTitle: "Admin" })
    .toArray();
  const moderatorRoster = await db
    .collection("Staff")
    .find({ staffTitle: "Moderator" })
    .toArray();

  return {
    adminRoster: adminRoster as unknown as staffRoster[],
    moderatorRoster: moderatorRoster as unknown as staffRoster[],
  };
}

export default async function StaffRoster() {
  const { adminRoster, moderatorRoster } = await getStaffRoster();
  const imageWidth = 120;
  const imageHeight = 100;
  return (
    <div>
      {adminRoster && adminRoster.length > 0 && (
        <section>
          <h2 className="mb-12 text-3xl font-bold text-center">Admin</h2>
          <div className="grid grid-cols-2 lg:gap-xl-12 gap-x-6 sm:gap-x-0 md:grid-cols-3 xl:grid-cols-6">
            {adminRoster.map((roster, index) => (
              <div key={index} className="mb-12 text-center hover:scale-110">
                <Image
                  className="mx-auto mb-4 rounded-full shadow-lg max-w-none dark:shadow-black/20"
                  src={roster.src}
                  alt={roster.altText}
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

      {moderatorRoster && moderatorRoster.length > 0 && (
        <section>
          <h2 className="mb-12 text-3xl font-bold text-center">Moderator</h2>
          <div className="grid grid-cols-2 lg:gap-xl-12 gap-x-6 sm:gap-x-0 md:grid-cols-3 xl:grid-cols-5">
            {moderatorRoster.map((roster, index) => (
              <div key={index} className="mb-12 text-center hover:scale-110">
                <Image
                  className="mx-auto mb-4 rounded-full shadow-lg max-w-none dark:shadow-black/20"
                  src={roster.src}
                  alt={roster.altText}
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
