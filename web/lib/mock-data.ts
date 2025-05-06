import { getProfileByUser, getAllProfile, getDemoByProfile } from "@/contracts/query";
import { Project,Profile } from "@/types/index";


// 定义一个函数来异步加载数据
export async function loadMockProjects(): Promise<Project[]> {
  const profiles = await getAllProfile();
  const allProjects: Project[] = [];
  console.log("Profiles:", profiles);
  // 对每个profile获取相关的demos
  for (const profile of profiles) {
    const demos = await getDemoByProfile(profile);
    
    // 将每个demo转换为Project格式
    const profileProjects = demos.map(demo => ({
      id: demo.id.id,
      name: demo.name,
      des: demo.des,
      profile: profile.name // 使用profile的name作为profile字段
    }));
    console.log("Profile Projects:", profileProjects);
    // 添加到总项目列表
    allProjects.push(...profileProjects);
  }

  return allProjects;
}

export async function loadMockUserProjects(user:string ): Promise<Project[]> {
  const profile = await getProfileByUser(user);
  const demos = await getDemoByProfile(profile);
  const allProjects: Project[] = [];
  // 将每个demo转换为Project格式
  const profileProjects = demos.map(demo => ({
    id: demo.id.id,
    name: demo.name,
    des: demo.des,
    profile: profile.name // 使用profile的name作为profile字段
  }));
  console.log("Profile Projects:", profileProjects);
  // 添加到总项目列表
  allProjects.push(...profileProjects);
  
  return allProjects;
}

// 提供一个同步版本用于初始渲染
export const mockProjects: Project[] = [
  {
    id: "placeholder-1",
    name: "Loading Projects...",
    des: "Please wait while projects are being loaded",
    profile: "System"
  }
];
