"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SubAdminList } from "@/components/admin/sub-admin-list"
import { Shield, Users, PlusCircle } from "lucide-react" // Added PlusCircle
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useCurrentAccount } from '@mysten/dapp-kit'
import { getSuperAdmin,getAdminList,addAdmin, removeAdmin } from '@/contracts/query'
import { Button } from "@/components/ui/button" // Added Button
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog" // Added Dialog components
import { Input } from "@/components/ui/input" // Added Input
import { Label } from "@/components/ui/label" // Added Label
import { useBetterSignAndExecuteTransaction } from "@/hooks/useBetterTx"


export default function AdminPage() {
  const router = useRouter()
  const account = useCurrentAccount();
  const [admins, setAdmins] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isAdmin = getSuperAdmin(account?.address!); 
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newAdminAddress, setNewAdminAddress] = useState("")
  
  const { handleSignAndExecuteTransaction: add } = useBetterSignAndExecuteTransaction({
    tx: addAdmin,
  })
  const { handleSignAndExecuteTransaction: remove } = useBetterSignAndExecuteTransaction({
    tx: removeAdmin,
  })

  // Move fetchSubAdmins outside the useEffect so it can be called anywhere in the component
  const fetchSubAdmins = async () => {
    setLoading(true)
    try {
      const data = await getAdminList();

      setAdmins(data);
    } catch (err) {
      console.error("Error fetching sub-admins:", err);
      setError("Failed to load sub-admins");
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 如果用户未连接钱包或不是管理员，重定向到首页
    if (!account) {
      router.push("/")
      return
    }
    if (!isAdmin) {
      router.push("/explore")
      return
    }
    
    // Fetch the list of sub-admins when the component loads
    fetchSubAdmins();
    console.log("Admin list fetched:", admins);
  }, [account])

  // 处理添加子管理员
  const handleAddSubAdmin = async () => {
    if (!newAdminAddress.startsWith("0x") || newAdminAddress.length < 10) {
      window.alert("Validation Error: Please enter a valid address.");
      return;
    }

    try {
      const superAdminID = await getSuperAdmin(account?.address!);
      if (!superAdminID) {
        window.alert("You are not authorized to add sub-admins.");
        return;
      }
      add({superAdminCap:superAdminID,account:newAdminAddress}).onSuccess(() => {
        console.log("Sub-admin added successfully");
        fetchSubAdmins(); // Refresh the list after adding
      }).execute();
    } catch (err) {
      console.error("Error adding sub-admin:", err);
      window.alert("Failed to add sub-admin. Please try again.");
    } 
  };

  // 处理删除子管理员
  const handleDeleteSubAdmin = async (addressToDelete: string) => {
    console.log("Deleting sub-admin:", addressToDelete);
    
    // 验证传入的地址而非输入框中的地址
    if (!addressToDelete || !addressToDelete.startsWith("0x") || addressToDelete.length < 10) {
      window.alert("Validation Error: Invalid address format.");
      return;
    }
    
    try {
      const superAdminID = await getSuperAdmin(account?.address!);
      console.log("SuperAdmin ID:", superAdminID);
      
      if (!superAdminID) {
        window.alert("You are not authorized to remove sub-admins.");
        return;
      }
      
      remove({
        superAdminCap: superAdminID, 
        account: addressToDelete
      })
      .onSuccess(() => {
        console.log("Sub-admin removed successfully");
        fetchSubAdmins(); // 刷新列表
      })
      .execute();
    } catch (err) {
      console.error("Error removing sub-admin:", err);
      window.alert("Failed to remove sub-admin. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
              <CardDescription>Please wait while we load the admin dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>

        <Tabs defaultValue="sub-admins" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="sub-admins" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Sub-Admins
            </TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="sub-admins" className="space-y-6">
            <div className="flex justify-end">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Sub-Admin
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Sub-Admin</DialogTitle>
                    <DialogDescription>
                      Enter the details for the new sub-administrator.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="new-admin-address" className="text-right">
                        Address
                      </Label>
                      <Input
                        id="new-admin-address"
                        value={newAdminAddress}
                        onChange={(e) => setNewAdminAddress(e.target.value)}
                        className="col-span-3"
                        placeholder="e.g., 0x123abc..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddSubAdmin} disabled={isSubmittingAdd}>
                      {isSubmittingAdd ? "Adding..." : "Add Sub-Admin"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Sub-Administrators</CardTitle>
                <CardDescription>Manage sub-administrators and their permissions.</CardDescription>
              </CardHeader>
              <CardContent>
                <SubAdminList
                  subAdmins={admins}
                  onDeleteSubAdmin={handleDeleteSubAdmin}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Admin Settings</CardTitle>
                <CardDescription>Configure global admin settings and permissions.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Admin settings will be available soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
