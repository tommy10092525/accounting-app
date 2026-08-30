import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel
} from "@/components/ui/select"
const FIELD_CLASS = "mt-2 h-12 rounded-xl border-2 border-brand-blue bg-card";

function RequiredBadge() {
  return <span className="ml-1 text-xs text-primary">必須</span>;
}

function OptionalBadge() {
  return <span className="ml-1 text-xs text-muted-foreground">任意</span>;
}

const SubscriptionAdminPage = () => {
  const [paymentMethod,setPaymentMethod]=useState("card")
  const [card, setCard] = useState("");
  const [exp,setExp]=useState("");
  const [csc,setCsc]=useState("")
  
  const [name,setName]=useState("")
  const [accountName,setAccountName]=useState("")

  const items=[
    // {label:"支払方法を選択してください",value:null},
    {label:"銀行振り込み",value:"account",},
    {label:"クレジットカード",value:"card",},
  ]

  return (
    <div>
      <form action="" className="">
        <Select onValueChange={(value=>setPaymentMethod(value))}>
          <SelectTrigger className={FIELD_CLASS}>
            <SelectValue/>
          </SelectTrigger>
          <SelectContent className="border-brand-blue border-2 rounded-xl">
            <SelectGroup>
              <SelectLabel>支払方法</SelectLabel>
              {items.map(item=>(
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {paymentMethod==="card" &&<div>
          
          <div className="mt-6">
            <Label htmlFor="card">
              カード番号 <RequiredBadge />
            </Label>
            <Input
              id="card"
              required
              placeholder="1234 1234 1234 1234"
              className={FIELD_CLASS}
              value={card}
              autoComplete="cc-number"
              onChange={(e) => setCard(e.target.value)}
              type="password"
            />
          </div>
          <div className="mt-6">
            <Label htmlFor="cc-exp">
              有効期限 <RequiredBadge />
            </Label>
            <Input
              id="cc-exp"
              required
              placeholder="月 / 年"
              className={FIELD_CLASS}
              value={exp}
              autoComplete="cc-exp"
              onChange={(e) => setExp(e.target.value)}
            />
          </div>
          <div className="mt-6">
            <Label htmlFor="cc-csc">
              セキュリティーコード <RequiredBadge />
            </Label>
            <Input
              id="cc-csc"
              required
              // placeholder=""
              className={FIELD_CLASS}
              value={csc}
              autoComplete="cc-csc"
              onChange={(e) => setCsc(e.target.value)}
              type="password"
            />
          </div>
        </div>}

        {paymentMethod==="account" && <div className="">
          
          <div className="mt-6">
            <Label htmlFor="representative-name">
              名義 <RequiredBadge />
            </Label>
            <Input
              id="representative-name"
              required
              placeholder="テキストを入力"
              className={FIELD_CLASS}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="mt-6">
            <Label htmlFor="representative-name">
              口座名義 <RequiredBadge />
            </Label>
            <Input
              id="representative-name"
              required
              placeholder="テキストを入力"
              className={FIELD_CLASS}
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
          </div>
          </div>}
          <div className="border-brand-blue border-2 bg-card mt-6 rounded-xl p-6">
            <h2 className="text-sm">次回課金日</h2>
            <p className="text-xl">0000/00/00</p>
            <div className="border-t border-brand-blue m-2"></div>
            <h2 className="text-sm">金額</h2>
            <p className="text-xl">5,000</p>
          </div>
          <div className="flex justify-around mt-6"><button className="bg-rose-400 rounded-full py-2 px-4 text-white" type="button">カード情報変更</button></div>
          <div className="flex justify-around mt-6"><button className="bg-brand-blue rounded-full py-2 px-4 text-white" type="button">自動課金の解約</button></div>
      </form>
    </div>
  );
};

export default SubscriptionAdminPage;
