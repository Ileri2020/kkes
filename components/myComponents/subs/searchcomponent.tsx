'use client'
import { useState } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AiOutlineSearch } from "react-icons/ai";

export function SearchInput() {
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = async () => {
    try {
      const response = await axios.get(`/api/db?model=product`);
      const products = response.data;
      const filteredProducts = products.filter((product: any) =>
        product.name.toLowerCase().includes(searchValue.toLowerCase())
      );

      setSearchResults(filteredProducts);
    } catch (error) {
      console.error(error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    handleSearch();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <div className="hidden lg:flex w-[23%] relative flex-row justify-center items-center my-10">
        <Input
          placeholder="search"
          className="flex-1 border-0 dark:border-2"
          value={searchValue}
          onChange={handleInputChange}
        />
        <PopoverTrigger asChild className="absolute right-0 h-full rounded-sm text-background bg-accent w-10 p-2 text-xl">
          <AiOutlineSearch />
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-80">
        <div>
            <div>searches...</div>
            {searchResults.map(product => (
            <div key={product.id}>{product.name}</div>
        ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

