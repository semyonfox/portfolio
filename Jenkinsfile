// Production Jenkins loads its pipeline definition from
// server-stacks/jenkins/portfolio/Jenkinsfile. Keep this repository copy in
// sync for local documentation and tooling.
pipeline {
  agent { label 'docker-agent' }

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
      description: 'kept for job compatibility; the checked-out commit still requires GitHub CI'
    )
  }

  environment {
    APP_REPO = 'https://github.com/semyonfox/portfolio.git'
    APP_BRANCH = 'main'
    STACK_DIR = '/home/semyon/server-stacks/portfolio'
    COMPOSE_PROJECT_NAME = 'portfolio'
    CACHE_ROOT = '/home/jenkins/cache/buildkit'
    FRONTEND_IMAGE_REPO = 'portfolio-portfolio'
    API_IMAGE_REPO = 'portfolio-chat-api'
  }

  stages {
    stage('Checkout App') {
      steps {
        checkout([
          $class: 'GitSCM',
          branches: [[name: "*/${env.APP_BRANCH}"]],
          userRemoteConfigs: [[url: env.APP_REPO]]
        ])
      }
    }

    stage('Require GitHub CI') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'github-pat', usernameVariable: 'GITHUB_USERNAME', passwordVariable: 'GITHUB_TOKEN')]) {
          sh '''
            GITHUB_REPOSITORY=semyonfox/portfolio \
            GITHUB_REQUIRED_CHECKS='Frontend,Rust API,Deployment contract' \
              /home/semyon/server-stacks/jenkins/scripts/wait-for-github-ci.sh
          '''
        }
      }
    }

    stage('Verify Buildx builder') {
      steps {
        sh '''
          set -eu
          docker buildx inspect jenkins-cache --bootstrap | grep -Eq '^Driver:[[:space:]]+docker-container$'
        '''
      }
    }

    stage('Build images') {
      parallel {
        stage('Frontend') {
          steps {
            sh '''
              set -eu
              SHORT_COMMIT=$(git rev-parse --short=7 HEAD)
              IMAGE="${FRONTEND_IMAGE_REPO}:${SHORT_COMMIT}"
              CACHE_DIR="${CACHE_ROOT}/portfolio-prod-frontend"

              rm -rf "${CACHE_DIR}-new"
              mkdir -p "$CACHE_DIR"
              docker buildx build --builder jenkins-cache --load \
                --cache-from type=local,src="$CACHE_DIR" \
                --cache-to type=local,dest="${CACHE_DIR}-new",mode=max \
                --label app=portfolio \
                --label environment=prod \
                --label git-commit="$(git rev-parse HEAD)" \
                --label jenkins-build="$BUILD_TAG" \
                -t "$IMAGE" .
              rm -rf "$CACHE_DIR"
              mv "${CACHE_DIR}-new" "$CACHE_DIR"
              docker tag "$IMAGE" "${FRONTEND_IMAGE_REPO}:latest"
            '''
          }
        }
        stage('Chat API') {
          steps {
            sh '''
              set -eu
              SHORT_COMMIT=$(git rev-parse --short=7 HEAD)
              IMAGE="${API_IMAGE_REPO}:${SHORT_COMMIT}"
              CACHE_DIR="${CACHE_ROOT}/portfolio-prod-api"

              rm -rf "${CACHE_DIR}-new"
              mkdir -p "$CACHE_DIR"
              docker buildx build --builder jenkins-cache --load \
                --cache-from type=local,src="$CACHE_DIR" \
                --cache-to type=local,dest="${CACHE_DIR}-new",mode=max \
                --label app=portfolio-chat-api \
                --label environment=prod \
                --label git-commit="$(git rev-parse HEAD)" \
                --label jenkins-build="$BUILD_TAG" \
                -f api/Dockerfile \
                -t "$IMAGE" api
              rm -rf "$CACHE_DIR"
              mv "${CACHE_DIR}-new" "$CACHE_DIR"
              docker tag "$IMAGE" "${API_IMAGE_REPO}:latest"
            '''
          }
        }
      }
    }

    stage('Candidate smoke') {
      steps {
        sh '''
          set -eu
          SHORT_COMMIT=$(git rev-parse --short=7 HEAD)
          FRONTEND_IMAGE="${FRONTEND_IMAGE_REPO}:${SHORT_COMMIT}"
          API_IMAGE="${API_IMAGE_REPO}:${SHORT_COMMIT}"
          NETWORK=portfolio-candidate
          API_CANDIDATE=portfolio-chat-api-candidate
          FRONTEND_CANDIDATE=portfolio-candidate

          cleanup_candidate() {
            docker rm -f "$FRONTEND_CANDIDATE" "$API_CANDIDATE" >/dev/null 2>&1 || true
            docker network rm "$NETWORK" >/dev/null 2>&1 || true
          }
          trap cleanup_candidate EXIT

          cleanup_candidate
          # the default docker pools are exhausted; this /29 is reserved for the serialized portfolio smoke job
          docker network create --subnet 172.16.250.0/29 "$NETWORK" >/dev/null
          docker run -d --name "$API_CANDIDATE" \
            --network "$NETWORK" \
            --network-alias chat-api \
            --restart no \
            --tmpfs /tmp:rw,nosuid,nodev,size=64m \
            -e OPENROUTER_API_KEY=jenkins-candidate-placeholder \
            -e DB_PATH=/tmp/portfolio.db \
            "$API_IMAGE" >/dev/null
          docker run -d --name "$FRONTEND_CANDIDATE" \
            --network "$NETWORK" \
            --network-alias portfolio \
            --restart no \
            "$FRONTEND_IMAGE" >/dev/null

          for attempt in $(seq 1 30); do
            if docker exec "$FRONTEND_CANDIDATE" wget -qO- http://127.0.0.1/ >/dev/null \
              && docker exec "$FRONTEND_CANDIDATE" wget -qO- http://127.0.0.1/api/chat/health \
                | grep -Fq '"status":"ok"'; then
              echo "[candidate] Portfolio frontend and chat API are healthy"
              exit 0
            fi
            if [ "$attempt" -eq 30 ]; then
              docker logs "$API_CANDIDATE" || true
              docker logs "$FRONTEND_CANDIDATE" || true
              exit 1
            fi
            sleep 1
          done
        '''
      }
    }

    stage('Deploy with rollback') {
      steps {
        sh '''
          set -eu
          SHORT_COMMIT=$(git rev-parse --short=7 HEAD)
          cd "$STACK_DIR"
          compose() {
            docker compose --project-name "$COMPOSE_PROJECT_NAME" --env-file stack.env -f stack.yaml "$@"
          }

          capture_previous_image() {
            service="$1"
            repository="$2"
            container=$(compose ps -q "$service" || true)
            if [ -z "$container" ]; then
              return 0
            fi
            image=$(docker inspect -f '{{.Image}}' "$container")
            docker tag "$image" "${repository}:rollback-${BUILD_NUMBER}"
            printf '%s' "$image"
          }

          PREVIOUS_FRONTEND_IMAGE=$(capture_previous_image portfolio "$FRONTEND_IMAGE_REPO")
          PREVIOUS_API_IMAGE=$(capture_previous_image chat-api "$API_IMAGE_REPO")

          rollback() {
            echo "[rollback] restoring the previously running Portfolio images"
            if [ -n "$PREVIOUS_FRONTEND_IMAGE" ]; then
              docker tag "$PREVIOUS_FRONTEND_IMAGE" "${FRONTEND_IMAGE_REPO}:latest"
            fi
            if [ -n "$PREVIOUS_API_IMAGE" ]; then
              docker tag "$PREVIOUS_API_IMAGE" "${API_IMAGE_REPO}:latest"
            fi
            compose up -d --no-build --force-recreate portfolio chat-api
          }

          if ! compose up -d --no-build --force-recreate portfolio chat-api; then
            rollback
            exit 1
          fi

          for attempt in $(seq 1 30); do
            if compose exec -T portfolio wget -qO- http://127.0.0.1/ >/dev/null \
              && compose exec -T portfolio wget -qO- http://127.0.0.1/api/chat/health \
                | grep -Fq '"status":"ok"'; then
              if ! compose up -d --no-build tunnel; then
                rollback
                exit 1
              fi
              for public_attempt in $(seq 1 30); do
                if curl -fsS https://semyon.ie/ >/dev/null \
                  && curl -fsS https://semyon.ie/api/chat/health \
                    | grep -Fq '"status":"ok"'; then
                  break
                fi
                if [ "$public_attempt" -eq 30 ]; then
                  echo "[deploy] public smoke failed; rolling back" >&2
                  rollback
                  exit 1
                fi
                sleep 2
              done
              compose ps
              docker image rm \
                "${FRONTEND_IMAGE_REPO}:rollback-${BUILD_NUMBER}" \
                "${API_IMAGE_REPO}:rollback-${BUILD_NUMBER}" \
                >/dev/null 2>&1 || true
              echo "[deploy] Portfolio images for ${SHORT_COMMIT} are healthy"
              exit 0
            fi
            if [ "$attempt" -eq 30 ]; then
              echo "[deploy] final smoke failed; rolling back" >&2
              rollback
              exit 1
            fi
            sleep 2
          done
        '''
      }
    }
  }

  post {
    always {
      script {
        if (env.NODE_NAME) {
          deleteDir()
        } else {
          echo 'No agent workspace was allocated; skipping workspace cleanup'
        }
      }
    }
  }
}
