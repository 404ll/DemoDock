"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Filter, Search, Loader2, X } from "lucide-react"
import ProjectCard from "@/components/project-card"
import { loadMockProjects } from "@/lib/mock-data"
import type { Project } from "@/types/index"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { PROJECT_TYPES } from "@/types/index"
import { StatsOverview } from "@/components/state-overview"
import { getState } from "@/contracts/query"

// 添加这个辅助函数来获取类型标签
const getTypeLabel = (typeValue: string): string => {
  const typeObj = PROJECT_TYPES.find((t) => t.value === typeValue)
  return typeObj ? typeObj.label : typeValue
}

// 添加一个函数来获取唯一开发者数量
const getUniqueDevelopers = async (): Promise<number> => {
  const state = await getState();
  return state.profiles.length;
}

export default function ExplorePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [availableTypes, setAvailableTypes] = useState<string[]>([])
  const [totalDevelopers, setTotalDevelopers] = useState(0)

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true)
        setError(null)

        const fetchedProjects = await loadMockProjects()

        const adaptedProjects: Project[] = fetchedProjects.map((p) => ({
          id: p.id,
          name: p.name,
          des: p.des,
          profile: p.profile,
          visitor_list: p.visitor_list || [], // 确保visitor_list存在
          repo: p.repo || "", // 添加默认值或从数据中获取
          type: p.type || "unknown", // 添加默认值或从数据中获取
        }))

        // 提取所有可用的项目类型
        const types = PROJECT_TYPES.map((type) => type.value)
        setAvailableTypes(types)
        setProjects(adaptedProjects)
        setFilteredProjects(adaptedProjects)

        // 计算唯一开发者数量
        const uniqueDevelopers = await getUniqueDevelopers()
        setTotalDevelopers(uniqueDevelopers)
      } catch (err) {
        console.error("Failed to load projects:", err)
        setError("无法加载项目数据，请稍后再试")
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  // 更新过滤逻辑，同时考虑搜索查询和类型过滤
  useEffect(() => {
    let filtered = projects

    // 应用搜索过滤
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.des.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // 应用类型过滤
    if (selectedType) {
      if (selectedType === "other") {
        // 当选择"other"时，显示所有不在预定义类型列表中的项目
        const predefinedTypeValues = PROJECT_TYPES.map((t) => t.value)
        filtered = filtered.filter((project) => !predefinedTypeValues.includes(project.type) || project.type === "test")
      } else {
        // 正常过滤逻辑 - 显示特定类型
        filtered = filtered.filter((project) => project.type === selectedType)
      }
    }

    setFilteredProjects(filtered)
  }, [searchQuery, selectedType, projects])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleTypeSelect = (type: string) => {
    setSelectedType(type === selectedType ? null : type)
  }

  const clearTypeFilter = () => {
    setSelectedType(null)
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Explore Projects</h1>
          <p className="text-muted-foreground">Discover the latest demos from Web3 developers</p>
        </div>

        {/* 添加统计概览组件 */}
        <StatsOverview totalProjects={projects.length} totalDevelopers={totalDevelopers} className="mb-2" />

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search projects..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearch}
              disabled={loading}
            />
          </div>

          {/* 类型过滤下拉菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={loading}>
                <Filter className="h-4 w-4" />
                {selectedType ? `Type: ${getTypeLabel(selectedType)}` : "Filter by Type"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 max-h-[300px] overflow-y-auto">
              {availableTypes.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={selectedType === type}
                  onCheckedChange={() => handleTypeSelect(type)}
                >
                  {getTypeLabel(type)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 显示活跃的过滤器 */}
        {selectedType && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              Type: {getTypeLabel(selectedType)}
              <button onClick={clearTypeFilter} className="ml-1 rounded-full hover:bg-muted p-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        )}

        {/* 显示错误信息 */}
        {error && <div className="p-4 bg-red-50 text-red-700 rounded-md">{error}</div>}

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Projects</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
          </TabsList>

          {/* 加载状态 */}
          {loading && (
            <div className="flex justify-center items-center h-60">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">加载项目中...</p>
              </div>
            </div>
          )}

          {/* 没有数据时的提示 */}
          {!loading && filteredProjects.length === 0 && (
            <div className="flex justify-center items-center h-60">
              <p className="text-muted-foreground">
                {selectedType === "other"
                  ? "没有找到自定义类型的项目"
                  : selectedType
                    ? `没有找到类型为 "${getTypeLabel(selectedType)}" 的项目`
                    : searchQuery
                      ? "没有找到匹配的项目"
                      : "找不到项目"}
              </p>
            </div>
          )}

          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {!loading && filteredProjects.map((project) => <ProjectCard key={project.id} project={project} />)}
            </div>
          </TabsContent>

          <TabsContent value="trending" className="mt-0">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {!loading && filteredProjects.map((project) => <ProjectCard key={project.id} project={project} />)}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="mt-0">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {!loading && filteredProjects.map((project) => <ProjectCard key={project.id} project={project} />)}
            </div>
          </TabsContent>

          <TabsContent value="popular" className="mt-0">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {!loading && filteredProjects.map((project) => <ProjectCard key={project.id} project={project} />)}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
