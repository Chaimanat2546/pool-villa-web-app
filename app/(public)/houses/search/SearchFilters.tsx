"use client";

import { faAngleDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useState } from "react";

type SearchFiltersProps = {
  defaultQ?: string;
  defaultMinPrice?: string;
  defaultMaxPrice?: string;
  defaultMaxFarsea?: string;
  defaultPeople?: string;
  defaultSort?: string;
  defaultRecommended?: string;
  action?: string;
  defaultWifi?: string;
  defaultGrill?: string;
  defaultPet?: string;
  defaultKaraoke?: string;
  defaultSlider?: string;
  defaultSwim?: string;
  defaultSnooker?: string;
  defaultDiscotech?: string;
  defaultFancyring?: string;
  defaultTabletennis?: string;
  defaultBillard?: string;
  defaultSwimmingKid?: string;
  defaultAirhockey?: string;
  defaultJacuzzi?: string;
  defaultBath?: string;
};

type AmenityName =
  | "wifi"
  | "grill"
  | "pet"
  | "karaoke"
  | "slider"
  | "swim"
  | "snooker"
  | "discotech"
  | "fancyring"
  | "tabletennis"
  | "billard"
  | "swimming_kid"
  | "airhockey"
  | "jacuzzi"
  | "bath";

type AmenityOption = {
  name: AmenityName;
  label: string;
};

export function SearchFilters({
  defaultQ = "",
  defaultMinPrice = "",
  defaultMaxPrice = "",
  defaultMaxFarsea = "",
  defaultPeople = "",
  defaultSort = "",
  defaultRecommended = "",
  action = "/houses/search",
  defaultWifi = "",
  defaultGrill = "",
  defaultPet = "",
  defaultKaraoke = "",
  defaultSlider = "",
  defaultSwim = "",
  defaultSnooker = "",
  defaultDiscotech = "",
  defaultFancyring = "",
  defaultTabletennis = "",
  defaultBillard = "",
  defaultSwimmingKid = "",
  defaultAirhockey = "",
  defaultJacuzzi = "",
  defaultBath = "",
}: SearchFiltersProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [minPriceVal, setMinPriceVal] = useState(defaultMinPrice || "0");
  const [maxPriceVal, setMaxPriceVal] = useState(defaultMaxPrice || "30000");
  const [maxFarseaVal, setMaxFarseaVal] = useState(defaultMaxFarsea || "0");
  const [peopleVal, setPeopleVal] = useState(defaultPeople || "0");
  const [sortVal, setSortVal] = useState(defaultSort);
  const [amenities, setAmenities] = useState<Record<AmenityName, boolean>>({
    wifi: defaultWifi === "y",
    grill: defaultGrill === "y",
    pet: defaultPet === "y",
    karaoke: defaultKaraoke === "y",
    slider: defaultSlider === "y",
    swim: defaultSwim === "y",
    snooker: defaultSnooker === "y",
    discotech: defaultDiscotech === "y",
    fancyring: defaultFancyring === "y",
    tabletennis: defaultTabletennis === "y",
    billard: defaultBillard === "y",
    swimming_kid: defaultSwimmingKid === "y",
    airhockey: defaultAirhockey === "y",
    jacuzzi: defaultJacuzzi === "y",
    bath: defaultBath === "y",
  });

  const amenityOptions: AmenityOption[] = [
    { name: "wifi", label: "WiFi" },
    { name: "grill", label: "เตาปิ้งย่าง" },
    { name: "pet", label: "สัตว์เลี้ยงเข้าได้" },
    { name: "karaoke", label: "คาราโอเกะ" },
    { name: "slider", label: "สไลเดอร์" },
    { name: "swim", label: "สระว่ายน้ำ" },
    { name: "snooker", label: "สนุ๊กเกอร์" },
    { name: "discotech", label: "ไฟเธค" },
    { name: "fancyring", label: "ห่วงยางแฟนซี" },
    { name: "tabletennis", label: "โต๊ะปิงปอง" },
    { name: "billard", label: "บิลเลียด" },
    { name: "swimming_kid", label: "สระว่ายน้ำเด็ก" },
    { name: "airhockey", label: "แอร์ฮอกกี้" },
    { name: "jacuzzi", label: "อ่างจากุซซี่" },
    { name: "bath", label: "อ่างอาบน้ำ" },
  ];

  function toggleMenu(menu: string) {
    setOpenMenu((current) => (current === menu ? null : menu));
  }

  function setAmenity(name: AmenityName, checked: boolean) {
    setAmenities((current) => ({
      ...current,
      [name]: checked,
    }));
  }

  const shouldSubmitMinPrice = minPriceVal !== "0" || Boolean(defaultMinPrice);
  const shouldSubmitMaxPrice =
    maxPriceVal !== "30000" || Boolean(defaultMaxPrice);
  const shouldSubmitMaxFarsea =
    maxFarseaVal !== "0" || Boolean(defaultMaxFarsea);
  const shouldSubmitPeople = peopleVal !== "0" || Boolean(defaultPeople);

  return (
    <form action={action} method="get" className="mb-8 space-y-4">
      <input
        type="hidden"
        name="minPrice"
        value={minPriceVal}
        disabled={!shouldSubmitMinPrice}
      />
      <input
        type="hidden"
        name="maxPrice"
        value={maxPriceVal}
        disabled={!shouldSubmitMaxPrice}
      />
      <input
        type="hidden"
        name="maxFarsea"
        value={maxFarseaVal}
        disabled={!shouldSubmitMaxFarsea}
      />
      <input
        type="hidden"
        name="people"
        value={peopleVal}
        disabled={!shouldSubmitPeople}
      />
      <input type="hidden" name="sort" value={sortVal} disabled={!sortVal} />
      <input
        type="hidden"
        name="recommended"
        value="y"
        disabled={defaultRecommended !== "y"}
      />
      {amenityOptions.map((amenity) =>
        amenities[amenity.name] ? (
          <input
            key={amenity.name}
            type="hidden"
            name={amenity.name}
            value="y"
          />
        ) : null,
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          name="q"
          defaultValue={defaultQ}
          placeholder="ค้นหาบ้าน / รหัสบ้าน"
          className="h-10 min-w-[220px] rounded-full border px-4 text-sm"
        />

        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu("price")}
            className="h-10 rounded-full border px-4 text-sm"
          >
            Price<FontAwesomeIcon icon={faAngleDown} />
          </button>

          {openMenu === "price" && (
            <div className="absolute z-20 mt-2 w-72 rounded-xl border bg-white p-4 shadow-lg">
              <label className="mb-4 block text-sm">
                <div className="mb-2 flex justify-between">
                  <span>ราคาเริ่มต้น</span>
                  <span className="font-semibold text-accent">
                    {minPriceVal === "0"
                      ? "ไม่กำหนด"
                      : `฿ ${Number(minPriceVal).toLocaleString()}`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30000"
                  step="500"
                  value={minPriceVal}
                  onChange={(event) => setMinPriceVal(event.target.value)}
                  className="w-full accent-accent"
                />
              </label>

              <label className="block text-sm">
                <div className="mb-2 flex justify-between">
                  <span>ราคาสูงสุด</span>
                  <span className="font-semibold text-accent">
                    {maxPriceVal === "30000"
                      ? "ไม่จำกัด"
                      : `฿ ${Number(maxPriceVal).toLocaleString()}`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30000"
                  step="500"
                  value={maxPriceVal}
                  onChange={(event) => setMaxPriceVal(event.target.value)}
                  className="w-full accent-accent"
                />
              </label>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu("people")}
            className="h-10 rounded-full border px-4 text-sm"
          >
            จำนวนคน<FontAwesomeIcon icon={faAngleDown} />
          </button>

          {openMenu === "people" && (
            <div className="absolute z-20 mt-2 w-64 rounded-xl border bg-white p-4 shadow-lg">
              <label className="block text-sm">
                <div className="mb-2 flex justify-between">
                  <span>จำนวนคนเข้าพัก</span>
                  <span className="font-semibold text-accent">
                    {peopleVal === "0" ? "ไม่กำหนด" : `${peopleVal} คนขึ้นไป`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={peopleVal}
                  onChange={(event) => setPeopleVal(event.target.value)}
                  className="w-full accent-accent"
                />
              </label>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu("farsea")}
            className="h-10 rounded-full border px-4 text-sm"
          >
            ระยะทะเล<FontAwesomeIcon icon={faAngleDown} />
          </button>

          {openMenu === "farsea" && (
            <div className="absolute z-20 mt-2 w-64 rounded-xl border bg-white p-4 shadow-lg">
              <label className="block text-sm">
                <div className="mb-2 flex justify-between">
                  <span>ห่างจากทะเลไม่เกิน</span>
                  <span className="font-semibold text-accent">
                    {maxFarseaVal === "0"
                      ? "ไม่กำหนด"
                      : `${maxFarseaVal} กม.`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={maxFarseaVal}
                  onChange={(event) => setMaxFarseaVal(event.target.value)}
                  className="w-full accent-accent"
                />
              </label>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu("amenities")}
            className="h-10 rounded-full border px-4 text-sm"
          >
            หมวดหมู่<FontAwesomeIcon icon={faAngleDown} />
          </button>

          {openMenu === "amenities" && (
            <div className="absolute z-20 mt-2 w-72 rounded-xl border bg-white p-4 shadow-lg">
              <div className="grid gap-3 text-sm">
                {amenityOptions.map((amenity) => (
                  <label key={amenity.name}>
                    <input
                      type="checkbox"
                      checked={amenities[amenity.name]}
                      onChange={(event) =>
                        setAmenity(amenity.name, event.target.checked)
                      }
                    />{" "}
                    {amenity.label}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu("sort")}
            className="h-10 rounded-full border px-4 text-sm"
          >
            Sort<FontAwesomeIcon icon={faAngleDown} />
          </button>

          {openMenu === "sort" && (
            <div className="absolute z-20 mt-2 w-64 rounded-xl border bg-white p-4 shadow-lg">
              <select
                value={sortVal}
                onChange={(event) => setSortVal(event.target.value)}
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="">ไม่เรียงลำดับ</option>
                <option value="price_asc">ราคาน้อยไปมาก</option>
                <option value="price_desc">ราคามากไปน้อย</option>
                <option value="people_asc">จำนวนคนน้อยไปมาก</option>
                <option value="people_desc">จำนวนคนมากไปน้อย</option>
                <option value="farsea_asc">ใกล้ทะเลที่สุดก่อน</option>
                <option value="farsea_desc">ไกลทะเลที่สุดก่อน</option>
              </select>
            </div>
          )}
        </div>

        <button className="h-10 rounded-full bg-brand px-5 text-sm text-brand-foreground transition-colors hover:bg-brand/90">
          ค้นหา
        </button>

        <Link
          href="/houses/search"
          className="flex h-10 items-center rounded-full border px-5 text-sm"
        >
          ล้างค่า
        </Link>
      </div>
    </form>
  );
}
