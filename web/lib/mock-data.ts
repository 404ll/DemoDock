import { getProfileByUser, getAllProfile, getDemoByProfile } from "@/contracts/query";
import { Project,Profile } from "@/types/index";


// 定义一个函数来异步加载数据
export async function loadMockProjects(): Promise<Project[]> {
  const profiles = await getAllProfile();
  const allProjects: Project[] = [];
  // 对每个profile获取相关的demos
  for (const profile of profiles) {
    if (!profile) {
      console.error("Profile is null, skipping demo retrieval.");
      return [];
    }
    const demos = await getDemoByProfile(profile);
    // 将每个demo转换为Project格式
    const profileProjects = demos.map(demo => ({
      id: demo.id.id,
      name: demo.name,
      des: demo.des,
      repo: demo.repo as string,
      type: demo.demo_type as string,
      profile: profile.name ,// 使用profile的name作为profile字段
      visitor_list: demo.visitor_list // 添加visitor_list字段
    }));
    
    // 添加到总项目列表
    allProjects.push(...profileProjects);
  }
  console.log("all Projects:", allProjects);
  return allProjects;
}

export async function loadMockUserProjects(user:string ): Promise<Project[]> {
  const profile = await getProfileByUser(user);
  if (!profile) {
    console.error("Profile is null, skipping demo retrieval.");
    return [];
  }
  const demos = await getDemoByProfile(profile);
  console.log("源demo:", demos);
  const allUserProjects: Project[] = [];
  // 将每个demo转换为Project格式
  const profileProjects = demos.map(demo => ({
    id: demo.id.id,
    name: demo.name,
    des: demo.des,
    repo: demo.repo as string,
    type: demo.demo_type as string,
    profile: profile.name, // 使用profile的name作为profile字段
    visitor_list: demo.visitor_list // 添加visitor_list字段
  }));
  // 添加到总项目列表
  allUserProjects.push(...profileProjects);
  console.log("User all Projects:", allUserProjects);
  return allUserProjects;
}


