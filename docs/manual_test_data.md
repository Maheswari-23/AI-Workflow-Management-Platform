# 🧪 Simple Manual Testing Guide (Quick Demo)

Here is a very straightforward, step-by-step guide with exact data you can copy-paste to test the platform manually. No complex enterprise workflows, no schedulers—just a raw test of the AI engine.

---

## Step 1: Check LLM Settings (The Brain)
*Go to `Settings -> LLM Models`*
1. Click on **Groq**.
2. **API Key**: Enter your valid Groq API key (starts with `gsk_`).
3. Click **Set as Default**.

---

## Step 2: The Agent (The Worker)
*Go to `Agents`*
Let's create a single, simple AI worker.
1. Click **+ New Agent**.
2. **Agent Name**: `Math_Genius`
3. **System Prompt**: `You are a brilliant mathematician. When given a problem, solve it step-by-step and provide the final answer clearly.`
4. Click **Create**.

---

## Step 3: Tools Registry (The Hands)
*Go to `Tools`*
You don't need to click or create anything here! 
Just verify that the **Standard_Office_Calculator** tool is in the list. This proves the system is pre-loaded with capabilities.

---

## Step 4: The Task (The Job)
*Go to `Tasks`*
Now we give the AI something easy to do.

1. Click **+ New Task**.
2. **Task Name**: `Calculate Big Numbers`
3. **Description**: `Calculate what 15,234 multiplied by 89 is.`
4. Click **Create**.

*Inside the Task Panel:*
1. **Assigned Agents**: Select your `Math_Genius` from the list.
2. **Workflow Steps**: Simply type: `1. Solve the math problem using the calculator tool.`
3. *(Skip the scheduler—we are running this live!)*

---

## Step 5: Run and Prove (The Magic)
*Still on the `Tasks` page, looking at your new task:*

1. Click the purple **Run Task Now** button at the top right.
2. You will be taken to the **Run History** page automatically.
3. Wait a few seconds for the status to change from `running` to `completed`.
4. **Click the row** to open the logs.
5. In the logs, you will see the exact moment the AI decides to use the calculator tool, and then it will provide the final answer (`1,355,826`).

*🎉 **Test Complete!** You've just proved the core engine works perfectly.*
