"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

const TableSearch = () => {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const value = (formData.get("search") as string) || "";

    const params = new URLSearchParams(window.location.search);

    if (value.trim() === "") {
      // if empty, remove the search param
      params.delete("search");
    } else {
      params.set("search", value.trim());
    }

    // reset to first page on new search
    params.set("page", "1");

    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-3 py-1 bg-white"
    >
      <Image src="/search.png" alt="Search" width={14} height={14} />
      <input
        name="search"
        type="text"
        placeholder="Search.."
        defaultValue={typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("search") ?? "" : ""}
        className="w-[200px] p-2 bg-transparent outline-none"
      />
    </form>
  );
};

export default TableSearch;
