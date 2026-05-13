"use client";

import Link from "next/link";
import { useState } from "react";

type SearchFiltersProps = {
    defaultQ?: string;
    defaultMinPrice?: string;
    defaultMaxPrice?: string;
    defaultPeople?: string;
    defaultSort?: string;
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
    defaultSwimming_kid?: string;
    defaultAirhockey?: string;
    defaultJacuzzi?: string;
    defaultBath?: string;
};

export function SearchFilters({
    defaultQ = "",
    defaultMinPrice = "",
    defaultMaxPrice = "",
    defaultPeople = "",
    defaultSort = "",
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
    defaultSwimming_kid = "",
    defaultAirhockey = "",
    defaultJacuzzi = "",
    defaultBath = "",
}: SearchFiltersProps) {
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [minPriceVal, setMinPriceVal] = useState(defaultMinPrice || "0");
    const [maxPriceVal, setMaxPriceVal] = useState(defaultMaxPrice || "30000");
    const [peopleVal, setPeopleVal] = useState(defaultPeople || "0");

    function toggleMenu(menu: string) {
        setOpenMenu((current) => (current === menu ? null : menu));
    }

    return (
        <form className="mb-8 space-y-4">
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
                        Price⌄
                    </button>

                    {openMenu === "price" && (
                        <div className="absolute z-20 mt-2 w-72 rounded-xl border bg-white p-4 shadow-lg">
                            <label className="mb-4 block text-sm">
                                <div className="mb-2 flex justify-between">
                                    <span>ราคาเริ่มต้น</span>
                                    <span className="font-semibold text-blue-600">
                                        {minPriceVal === "0" ? "ไม่กำหนด" : `฿ ${Number(minPriceVal).toLocaleString()}`}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    name="minPrice"
                                    min="0"
                                    max="30000"
                                    step="500"
                                    value={minPriceVal}
                                    onChange={(e) => setMinPriceVal(e.target.value)}
                                    className="w-full accent-blue-600"
                                />
                            </label>

                            <label className="block text-sm">
                                <div className="mb-2 flex justify-between">
                                    <span>ราคาสูงสุด</span>
                                    <span className="font-semibold text-blue-600">
                                        {maxPriceVal === "30000" ? "ไม่จำกัด" : `฿ ${Number(maxPriceVal).toLocaleString()}`}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    name="maxPrice"
                                    min="0"
                                    max="30000"
                                    step="500"
                                    value={maxPriceVal}
                                    onChange={(e) => setMaxPriceVal(e.target.value)}
                                    className="w-full accent-blue-600"
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
                        จำนวนคน⌄
                    </button>

                    {openMenu === "people" && (
                        <div className="absolute z-20 mt-2 w-64 rounded-xl border bg-white p-4 shadow-lg">
                            <label className="block text-sm">
                                <div className="mb-2 flex justify-between">
                                    <span>จำนวนคนเข้าพัก</span>
                                    <span className="font-semibold text-blue-600">
                                        {peopleVal === "0" ? "ไม่กำหนด" : `${peopleVal} คนขึ้นไป`}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    name="people"
                                    min="0"
                                    max="30"
                                    step="1"
                                    value={peopleVal}
                                    onChange={(e) => setPeopleVal(e.target.value)}
                                    className="w-full accent-blue-600"
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
                        หมวดหมู่⌄
                    </button>

                    {openMenu === "amenities" && (
                        <div className="absolute z-20 mt-2 w-72 rounded-xl border bg-white p-4 shadow-lg">
                            <div className="grid gap-3 text-sm">
                                <label>
                                    <input type="checkbox" name="wifi" value="y" defaultChecked={defaultWifi === "y"} /> WiFi
                                </label>
                                <label>
                                    <input type="checkbox" name="grill" value="y" defaultChecked={defaultGrill === "y"} /> เตาปิ้งย่าง
                                </label>
                                <label>
                                    <input type="checkbox" name="pet" value="y" defaultChecked={defaultPet === "y"} /> สัตว์เลี้ยงเข้าได้
                                </label>
                                <label>
                                    <input type="checkbox" name="karaoke" value="y" defaultChecked={defaultKaraoke === "y"} /> คาราโอเกะ
                                </label>
                                <label>
                                    <input type="checkbox" name="slider" value="y" defaultChecked={defaultSlider === "y"} /> สไลเดอร์
                                </label>
                                <label>
                                    <input type="checkbox" name="swim" value="y" defaultChecked={defaultSwim === "y"} /> สระว่ายน้ำ
                                </label>
                                <label>
                                    <input type="checkbox" name="snooker" value="y" defaultChecked={defaultSnooker === "y"} /> สนุ๊กเกอร์
                                </label>
                                <label>
                                    <input type="checkbox" name="discotech" value="y" defaultChecked={defaultDiscotech === "y"} /> ไฟเธค
                                </label>
                                <label>
                                    <input type="checkbox" name="fancyring" value="y" defaultChecked={defaultFancyring === "y"} /> ห่วงยางแฟนซี
                                </label>
                                <label>
                                    <input type="checkbox" name="tabletennis" value="y" defaultChecked={defaultTabletennis === "y"} /> โต๊ะปิงปอง
                                </label>
                                <label>
                                    <input type="checkbox" name="billard" value="y" defaultChecked={defaultBillard === "y"} /> บิลเลียด
                                </label>
                                <label>
                                    <input type="checkbox" name="swimming_kid" value="y" defaultChecked={defaultSwimming_kid === "y"} /> สระว่ายน้ำเด็ก
                                </label>
                                <label>
                                    <input type="checkbox" name="airhockey" value="y" defaultChecked={defaultAirhockey === "y"} /> แอร์ฮอกกี้
                                </label>
                                <label>
                                    <input type="checkbox" name="jacuzzi" value="y" defaultChecked={defaultJacuzzi === "y"} /> อ่างจากุซซี่
                                </label>
                                <label>
                                    <input type="checkbox" name="bath" value="y" defaultChecked={defaultBath === "y"} /> อ่างอาบน้ำ
                                </label>
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
                        Sort⌄
                    </button>

                    {openMenu === "sort" && (
                        <div className="absolute z-20 mt-2 w-64 rounded-xl border bg-white p-4 shadow-lg">
                            <select
                                name="sort"
                                defaultValue={defaultSort}
                                className="w-full rounded-md border px-3 py-2"
                            >
                                <option value="">ไม่เรียงลำดับ</option>
                                <option value="price_asc">ราคาน้อยไปมาก</option>
                                <option value="price_desc">ราคามากไปน้อย</option>
                                <option value="people_asc">จำนวนคนน้อยไปมาก</option>
                                <option value="people_desc">จำนวนคนมากไปน้อย</option>
                            </select>
                        </div>
                    )}
                </div>

                <button className="h-10 rounded-full bg-black px-5 text-sm text-white">
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