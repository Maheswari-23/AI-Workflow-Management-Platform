/**
 * Container Manager - Manages Docker containers for task execution
 * Spawns, monitors, and cleans up task containers
 */

const { spawn } = require('child_process');
const EventEmitter = require('events');

class ContainerManager extends EventEmitter {
  constructor() {
    super();
    this.runningContainers = new Map();
    this.taskQueue = [];
    this.maxConcurrent = parseInt(process.env.MAX_CONCURRENT_TASKS || '5');
  }

  /**
   * Execute a task in a Docker container
   */
  async executeTask(taskConfig) {
    const containerId = `orchestr-task-${taskConfig.taskId}`;
    
    console.log(`🐳 Spawning container for task ${taskConfig.taskId}`);
    
    return new Promise((resolve, reject) => {
      // Build docker run command
      const dockerArgs = [
        'run',
        '--rm', // Remove container after execution
        '--name', containerId,
        '--network', 'bridge',
        
        // Resource limits
        '--memory', process.env.TASK_MEMORY_LIMIT || '512m',
        '--cpus', process.env.TASK_CPU_LIMIT || '1',
        
        // Environment variables
        '-e', `TASK_ID=${taskConfig.taskId}`,
        '-e', `TASK_DESCRIPTION=${taskConfig.description}`,
        '-e', `AGENT_ID=${taskConfig.agentId}`,
        '-e', `LLM_PROVIDER=${taskConfig.llmProvider}`,
        '-e', `MAX_STEPS=${taskConfig.maxSteps || 10}`,
        '-e', `TIMEOUT=${taskConfig.timeout || 300000}`,
        
        // Pass API keys
        '-e', `OPENAI_API_KEY=${process.env.OPENAI_API_KEY || ''}`,
        '-e', `ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY || ''}`,
        '-e', `GROQ_API_KEY=${process.env.GROQ_API_KEY || ''}`,
        '-e', `GOOGLE_API_KEY=${process.env.GOOGLE_API_KEY || ''}`,
        
        // Image name
        'orchestr-task-runner:latest'
      ];

      const docker = spawn('docker', dockerArgs);
      
      let output = '';
      let errorOutput = '';
      let result = null;
      let captureResult = false;

      // Track running container
      this.runningContainers.set(taskConfig.taskId, {
        containerId,
        process: docker,
        startTime: Date.now()
      });

      // Capture stdout
      docker.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        
        // Check for result markers
        if (text.includes('RESULT_START')) {
          captureResult = true;
          result = '';
        } else if (text.includes('RESULT_END')) {
          captureResult = false;
          try {
            result = JSON.parse(result);
          } catch (e) {
            console.error('Failed to parse result:', e);
          }
        } else if (captureResult) {
          result += text;
        }
        
        // Emit progress
        this.emit('task-progress', {
          taskId: taskConfig.taskId,
          output: text
        });
      });

      // Capture stderr
      docker.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error(`Container ${containerId} error:`, data.toString());
      });

      // Handle completion
      docker.on('close', (code) => {
        this.runningContainers.delete(taskConfig.taskId);
        
        console.log(`Container ${containerId} exited with code ${code}`);
        
        if (code === 0 && result) {
          resolve({
            success: true,
            result: result,
            output: output,
            exitCode: code
          });
        } else if (code === 124) {
          reject(new Error('Task timeout exceeded'));
        } else {
          reject(new Error(`Task failed with exit code ${code}: ${errorOutput}`));
        }
      });

      // Handle errors
      docker.on('error', (error) => {
        this.runningContainers.delete(taskConfig.taskId);
        console.error(`Failed to spawn container:`, error);
        reject(error);
      });
    });
  }

  /**
   * Stop a running task container
   */
  async stopTask(taskId) {
    const container = this.runningContainers.get(taskId);
    if (!container) {
      throw new Error(`Task ${taskId} not found`);
    }

    console.log(`🛑 Stopping container for task ${taskId}`);
    
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', ['stop', container.containerId]);
      
      docker.on('close', (code) => {
        this.runningContainers.delete(taskId);
        if (code === 0) {
          resolve({ success: true, message: 'Task stopped' });
        } else {
          reject(new Error(`Failed to stop container: exit code ${code}`));
        }
      });
      
      docker.on('error', reject);
    });
  }

  /**
   * Get status of all running tasks
   */
  getRunningTasks() {
    const tasks = [];
    for (const [taskId, container] of this.runningContainers) {
      tasks.push({
        taskId,
        containerId: container.containerId,
        startTime: container.startTime,
        duration: Date.now() - container.startTime
      });
    }
    return tasks;
  }

  /**
   * Check if Docker is available
   */
  async checkDockerAvailable() {
    return new Promise((resolve) => {
      const docker = spawn('docker', ['--version']);
      docker.on('close', (code) => resolve(code === 0));
      docker.on('error', () => resolve(false));
    });
  }

  /**
   * Build the task runner image
   */
  async buildTaskRunnerImage() {
    console.log('🔨 Building task runner Docker image...');
    
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', [
        'build',
        '-t', 'orchestr-task-runner:latest',
        '-f', 'containers/task-runner.dockerfile',
        '.'
      ]);

      docker.stdout.on('data', (data) => {
        console.log(data.toString());
      });

      docker.stderr.on('data', (data) => {
        console.error(data.toString());
      });

      docker.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Task runner image built successfully');
          resolve();
        } else {
          reject(new Error(`Docker build failed with code ${code}`));
        }
      });

      docker.on('error', reject);
    });
  }
}

// Singleton instance
const containerManager = new ContainerManager();

module.exports = containerManager;
