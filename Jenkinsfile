pipeline {
  agent any

  options {
    disableConcurrentBuilds()
    timestamps()
  }

  triggers {
    githubPush()
  }

  parameters {
    booleanParam(
      name: 'DEPLOY_ONLY',
      defaultValue: false,
      description: 'skip checks and redeploy the stack'
    )
  }

  environment {
    COMPOSE_PROJECT_NAME = 'portfolio'
    DEPLOY_SERVICES = 'portfolio chat-api tunnel'
    PORTFOLIO_ENV_FILE = '/srv/portfolio/.env'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout([
          $class: 'GitSCM',
          branches: [[name: '*/main']],
          userRemoteConfigs: [[url: 'https://github.com/semyonfox/portfolio.git']]
        ])
        script {
          def branch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: 'unknown'
          echo "building branch: ${branch}"
        }
      }
    }

    stage('Install Dependencies') {
      when {
        expression { !params.DEPLOY_ONLY }
      }
      steps {
        sh 'corepack enable'
        sh 'pnpm install --frozen-lockfile'
      }
    }

    stage('Lint') {
      when {
        expression { !params.DEPLOY_ONLY }
      }
      steps {
        sh '''
          if node -e "const s=require('./package.json').scripts||{}; process.exit(s.lint ? 0 : 1)"; then
            pnpm run lint
          else
            echo "no lint script found, skipping"
          fi
        '''
      }
    }

    stage('Test') {
      when {
        expression { !params.DEPLOY_ONLY }
      }
      steps {
        sh '''
          if node -e "const s=require('./package.json').scripts||{}; process.exit(s.test ? 0 : 1)"; then
            pnpm run test
          else
            echo "no test script found, skipping"
          fi
        '''
      }
    }

    stage('Deploy') {
      when {
        expression {
          if (params.DEPLOY_ONLY) {
            return true
          }

          return sh(
            script: 'git branch -r --contains HEAD | grep -E "origin/main$" >/dev/null 2>&1',
            returnStatus: true
          ) == 0
        }
      }
      steps {
        sh '''
          cp "$PORTFOLIO_ENV_FILE" ./.env
          docker-compose --project-name "$COMPOSE_PROJECT_NAME" --env-file "$PORTFOLIO_ENV_FILE" build $DEPLOY_SERVICES
          docker-compose --project-name "$COMPOSE_PROJECT_NAME" --env-file "$PORTFOLIO_ENV_FILE" up -d $DEPLOY_SERVICES
          docker-compose --project-name "$COMPOSE_PROJECT_NAME" --env-file "$PORTFOLIO_ENV_FILE" ps
          rm -f ./.env
        '''
      }
    }
  }

  post {
    always {
      deleteDir()
    }
  }
}
