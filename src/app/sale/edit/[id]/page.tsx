"use client"
import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"


const frameworks = [
  {
    value: "next.js",
    label: "Next.js",
  },
  {
    value: "sveltekit",
    label: "SvelteKit",
  },
  {
    value: "nuxt.js",
    label: "Nuxt.js",
  },
  {
    value: "remix",
    label: "Remix",
  },
  {
    value: "astro",
    label: "Astro",
  },
  {
    value: "Chck",
    label: "chck",
  },
  {
    value: "Peick",
    label: "peick",
  },
  {
    value: "Ruim4",
    label: "ruim4",
  },
  {
    value: "Isdf",
    label: "isdf",
  },
]

interface DetailPageProps {
  params: { id: string };
}

const EditPage = ({ params }: DetailPageProps) => {
  // const { id } = params;
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  return (
    <div className="mt-5">
      <h1 className="text-xl font-semibold">Edit Page</h1>

      <div className="mt-5">
          <div className="flex flex-col gap-5">
            <div className="md:max-w-1/2">
              <Input type="name" placeholder="Name"/>
            </div>
            <div>
                <Select>
                    <SelectTrigger className="w-[300px]">
                        <SelectValue placeholder="Table" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="table1">Table 1</SelectItem>
                        <SelectItem value="table2">Table 2</SelectItem>
                        <SelectItem value="table3">Table 3</SelectItem>
                    </SelectContent>
                </Select>
            </div>

             <div>
                <Select>
                    <SelectTrigger className="w-[300px]" >
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="booking">Booking</SelectItem>
                        <SelectItem value="having">Having</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                </Select>

            </div>
            <div>
              <Textarea className="md:max-w-1/2" placeholder="Desciprtion"/>
            </div>
          </div> 
      </div>

      <div className="mt-4 float-right">
        {/* <Button>Add new role</Button> */}
        {/* <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Add new</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add new</DialogTitle>
              <DialogDescription>
                Make changes to your profile here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input id="name_new" value="Pedro Duarte" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Username
                </Label>
                <Input id="username_new" value="@peduarte" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog> */}
      </div>
     
      <div className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* {invoices.map((invoice) => ( */}
              <TableRow key="1">
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">ကြက်ကာလာသား</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Add new</DialogTitle>
                        <DialogDescription>
                          Make changes to your profile here. Click save when you're done.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">
                            Name
                          </Label>
                          <Popover open={open} onOpenChange={setOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={open}
                              className="w-[200px] justify-between"
                            >
                              {value
                                ? frameworks.find((framework) => framework.value === value)?.label
                                : "Select framework..."}
                              <ChevronsUpDown className="opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] h-[200px] overflow-auto p-0">
                            <Command>
                              <CommandInput placeholder="Search framework..." className="h-9" />
                              <CommandList>
                                <CommandEmpty>No framework found.</CommandEmpty>
                                <CommandGroup>
                                  {frameworks.map((framework) => (
                                    <CommandItem
                                      key={framework.value}
                                      value={framework.value}
                                      onSelect={(currentValue) => {
                                        setValue(currentValue === value ? "" : currentValue)
                                        setOpen(false)
                                      }}
                                    >
                                      {framework.label}
                                      <Check
                                        className={cn(
                                          "ml-auto",
                                          value === framework.value ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                          
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="username" className="text-right">
                            Username
                          </Label>
                          {/* <Input id="username_" value="@peduarte" className="col-span-3" /> */}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Save changes</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
                <TableCell>၁၀၀၀၀</TableCell>
                <TableCell>၁၀</TableCell>
                <TableCell>၁၀၀၀၀ ကျပ်</TableCell>
              </TableRow>
            {/* ))} */}
          </TableBody>
          <TableFooter>
            <TableRow className="mt-5">
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell>၁၀၀၀၀၀ကျပ်</TableCell>
            </TableRow>
          </TableFooter>
        </Table>

      </div>
      
    </div>
  );
};

export default EditPage;