import * as readline from 'readline';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface LeaderboardSubmission {
  repo_url: string;
  repo_name: string;
  score: number;
  baseline_approved: boolean;
  suggestions_count: number;
  badges_earned: number;
}

export interface LeaderboardResponse {
  success: boolean;
  message?: string;
  entry?: any;
  rank?: number;
  totalEntries?: number;
}

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  version: string;
}

const LEADERBOARD_API_URL = 'https://baseline-leaderboard-backend.vercel.app/api/leaderboard';

export async function submitToLeaderboard(submission: LeaderboardSubmission): Promise<LeaderboardResponse> {
  const response = await fetch(LEADERBOARD_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log('❌ API Response:', errorText);
    throw new Error(`Leaderboard API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data as LeaderboardResponse;
}

export async function displayLeaderboardPrompt(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\n🎯 Would you like to add your score to the public leaderboard?');
    console.log('   This will help other developers see how they compare!');
    
    rl.question('Submit to leaderboard? (Y/n) ', (answer) => {
      rl.close();
      const shouldSubmit = !answer || answer.toLowerCase().startsWith('y');
      resolve(shouldSubmit);
    });
  });
}

export async function getRepoInfoFromUser(): Promise<{ url: string; name: string }> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\n📝 Please provide your repository information:');
    
    rl.question('GitHub Repository URL (e.g., https://github.com/username/repo): ', (url) => {
      // If URL is provided, extract repo name from it
      if (url && url.includes('github.com')) {
        const repoNameMatch = url.match(/github\.com[/:]([^/]+\/[^/]+)/);
        const repoName = repoNameMatch ? repoNameMatch[1] : null;
        
        if (repoName) {
          rl.close();
          resolve({ 
            url: url.replace('.git', ''), 
            name: repoName 
          });
          return;
        }
      }

      // If no valid URL or couldn't extract name, ask for repo name separately
      rl.question('Repository name (e.g., username/repo): ', (name) => {
        rl.close();
        
        // If no URL was provided but name was, construct a default URL
        if (!url && name) {
          url = `https://github.com/${name}`;
        }
        // If no name was provided but URL was, try to extract again
        else if (url && !name) {
          const repoNameMatch = url.match(/github\.com[/:]([^/]+\/[^/]+)/);
          name = repoNameMatch ? repoNameMatch[1] : 'unknown/repository';
        }
        // If neither was provided, use defaults
        else if (!url && !name) {
          url = 'https://github.com/unknown/repository';
          name = 'unknown/repository';
        }

        resolve({ 
          url: url.replace('.git', ''), 
          name: name 
        });
      });
    });
  });
}

export function calculateBadgesEarned(earnedBadges: any[]): number {
  return earnedBadges ? earnedBadges.length : 0;
}

export async function getRepoInfo(scanPath: string): Promise<{ url: string; name: string }> {
  try {
    // Try to get repo info from git
    const gitConfigPath = path.join(scanPath, '.git', 'config');
    
    if (fs.existsSync(gitConfigPath)) {
      try {
        // Get remote origin URL
        const remoteUrl = execSync('git config --get remote.origin.url', { 
          cwd: scanPath,
          encoding: 'utf8' 
        }).trim();

        if (remoteUrl) {
          // Convert SSH URL to HTTPS if needed
          let repoUrl = remoteUrl;
          if (remoteUrl.startsWith('git@')) {
            repoUrl = remoteUrl
              .replace('git@github.com:', 'https://github.com/')
              .replace('.git', '');
          } else if (remoteUrl.startsWith('https://')) {
            repoUrl = remoteUrl.replace('.git', '');
          }

          // Extract repo name from URL
          const repoNameMatch = repoUrl.match(/github\.com[/:]([^/]+\/[^/]+)/);
          const repoName = repoNameMatch ? repoNameMatch[1] : 'unknown/repository';

          console.log('✅ Detected repository:', repoName);
          return { url: repoUrl, name: repoName };
        }
      } catch (error) {
        console.log('ℹ️  Could not detect git repository automatically');
      }
    }
  } catch (error) {
    console.log('ℹ️  Could not detect git repository automatically');
  }

  // If auto-detection fails, ask the user
  return await getRepoInfoFromUser();
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch('https://baseline-leaderboard-backend.vercel.app/health');
    if (response.ok) {
      const health: HealthCheckResponse = await response.json() as HealthCheckResponse;
      console.log('✅ Backend health:', health.status);
      return true;
    }
    return false;
  } catch (error) {
    console.log('❌ Backend health check failed:', error instanceof Error ? error.message : error);
    return false;
  }
}

export async function handleLeaderboardSubmission(
  analysisResult: any, 
  scanPath: string, 
  earnedBadges: any[]
): Promise<void> {
  const score = analysisResult.scoreResult?.totalScore || 0;
  const suggestionsCount = analysisResult.suggestions?.length || 0;
  const baselineApproved = analysisResult.scoreResult?.baselineApproved || false;
  const badgesEarned = calculateBadgesEarned(earnedBadges);

  console.log('\n--- 🏆 Baseline Leaderboard ---');
  console.log(`Your score: ${score}`);
  console.log(`Suggestions found: ${suggestionsCount}`);
  console.log(`Baseline approved: ${baselineApproved ? '✅ Yes' : '❌ No'}`);
  console.log(`Badges earned: ${badgesEarned}`);

  // Check backend health first
  console.log('\n🔍 Checking backend connectivity...');
  const isHealthy = await checkBackendHealth();
  
  if (!isHealthy) {
    console.log('❌ Backend is not available. Please try again later.');
    console.log('💡 You can view the leaderboard at: https://baseline-leaderboard.vercel.app/');
    return;
  }

  const shouldSubmit = await displayLeaderboardPrompt();
  
  if (shouldSubmit) {
    try {
      const repoInfo = await getRepoInfo(scanPath);
      
      console.log('\n📋 Repository information:');
      console.log(`   Name: ${repoInfo.name}`);
      console.log(`   URL: ${repoInfo.url}`);
      
      const submission: LeaderboardSubmission = {
        repo_url: repoInfo.url,
        repo_name: repoInfo.name,
        score: score,
        baseline_approved: baselineApproved,
        suggestions_count: suggestionsCount,
        badges_earned: badgesEarned
      };

      console.log('\n📡 Submitting to leaderboard...');
      const result = await submitToLeaderboard(submission);
      
      if (result.success) {
        console.log('✅ Successfully submitted to leaderboard!');
        console.log(`🏆 View your ranking: https://baseline-leaderboard.vercel.app/`);
        
        if (result.rank && result.totalEntries) {
          console.log(`📊 Your rank: ${result.rank} out of ${result.totalEntries}`);
        }
        
        console.log(`🎯 Score: ${score}`);
        console.log(`📝 Repository: ${repoInfo.name}`);
      } else {
        console.log('❌ Failed to submit to leaderboard:', result.message);
        console.log('💡 You can still view the leaderboard at: https://baseline-leaderboard.vercel.app/');
      }
      
    } catch (error) {
      console.log('❌ Failed to submit to leaderboard:', error instanceof Error ? error.message : 'Unknown error');
      console.log('💡 You can still view the leaderboard at: https://baseline-leaderboard.vercel.app/');
    }
  } else {
    console.log('📊 You can view the leaderboard at: https://baseline-leaderboard.vercel.app/');
  }
}