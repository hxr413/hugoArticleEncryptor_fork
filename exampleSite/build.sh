set -x

hugo version

curl -sSfL -o hugoArticleEncryptor "https://github.com/hxr413/hugoArticleEncryptor_fork/releases/download/latest/hugoArticleEncryptor-linux-amd64"

chmod +x ./hugoArticleEncryptor

ls -lha

ls -lha themes 

./hugoArticleEncryptor

