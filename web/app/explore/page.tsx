"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Filter, Search, SlidersHorizontal, Loader2 } from "lucide-react"
import { ProjectCard } from "@/components/project-card"
import { mockProjects, loadMockProjects } from "@/lib/mock-data"
import { Project } from "@/types/index";

export default function ExplorePage() { 
  const [projects, setProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true)
        setError(null)
        
        const fetchedProjects = await loadMockProjects()
        
        const adaptedProjects: Project[] = fetchedProjects.map(p => ({
          id: p.id,
          name: p.name,
          des: p.des,
          profile: p.profile,
          visitor_list: p.visitor_list || [] // 确保visitor_list存在
        }))
        
        setProjects(adaptedProjects)
        setFilteredProjects(adaptedProjects)
      } catch (err) {
        console.error("Failed to load projects:", err)
        setError("无法加载项目数据，请稍后再试")
        
        const fallbackProjects = mockProjects.map(p => ({
          id: p.id,
          name: p.name,
          des: p.des,
          profile: p.profile,
          visitor_list: p.visitor_list || [] // 确保visitor_list存在
        }))
        
        setProjects(fallbackProjects)
        setFilteredProjects(fallbackProjects)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProjects()
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    if (query.trim() === "") {
      setFilteredProjects(projects)
    } else {
      const filtered = projects.filter(
        (project) =>
          project.name.toLowerCase().includes(query.toLowerCase()) ||
          project.des.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredProjects(filtered)
    }
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Explore Projects</h1>
          <p className="text-muted-foreground">Discover the latest demos from Web3 developers</p>
        </div>

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
          <Button variant="outline" className="gap-2" disabled={loading}>
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline" className="gap-2" disabled={loading}>
            <SlidersHorizontal className="h-4 w-4" />
            Sort
          </Button>
        </div>

        {/* 显示错误信息 */}
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

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
              <p className="text-muted-foreground">找不到项目</p>
            </div>
          )}
          
          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {!loading && filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="trending" className="mt-0">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {!loading && filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="recent" className="mt-0">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {!loading && filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="popular" className="mt-0">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {!loading && filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
