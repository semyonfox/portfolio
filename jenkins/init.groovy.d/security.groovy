import hudson.security.FullControlOnceLoggedInAuthorizationStrategy
import hudson.security.HudsonPrivateSecurityRealm
import jenkins.install.InstallState
import jenkins.model.Jenkins
import jenkins.model.JenkinsLocationConfiguration

def instance = Jenkins.get()
def env = System.getenv()

def adminUser = env.getOrDefault("JENKINS_ADMIN_USER", "admin")
def adminPassword = env.getOrDefault("JENKINS_ADMIN_PASSWORD", "change-me-now")

def realm = new HudsonPrivateSecurityRealm(false)
if (realm.getUser(adminUser) == null) {
    realm.createAccount(adminUser, adminPassword)
}
instance.setSecurityRealm(realm)

def strategy = new FullControlOnceLoggedInAuthorizationStrategy()
strategy.setAllowAnonymousRead(false)
instance.setAuthorizationStrategy(strategy)

def jenkinsUrl = env.getOrDefault("JENKINS_URL", "")
if (!jenkinsUrl.isBlank()) {
    def location = JenkinsLocationConfiguration.get()
    location.setUrl(jenkinsUrl)
    location.save()
}

instance.setInstallState(InstallState.INITIAL_SETUP_COMPLETED)
instance.save()
