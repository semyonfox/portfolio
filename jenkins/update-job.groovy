import com.cloudbees.jenkins.GitHubPushTrigger
import jenkins.model.Jenkins
import org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition
import org.jenkinsci.plugins.workflow.job.WorkflowJob

def jenkins = Jenkins.instance
String jobName = 'portfolio-cicd'

WorkflowJob job = jenkins.getItem(jobName) as WorkflowJob
if (job == null) {
    job = jenkins.createProject(WorkflowJob, jobName)
}

def pipelineScript = new File('/tmp/Jenkinsfile').text
job.setDefinition(new CpsFlowDefinition(pipelineScript, true))
job.getTriggers().clear()

def trigger = new GitHubPushTrigger()
job.addTrigger(trigger)
job.save()
trigger.start(job, true)

println("updated ${jobName}")
